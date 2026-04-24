export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { 
  IMGBB_API_KEY, 
  IMGBB_API_URL, 
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  MAX_FILE_SIZE,
  MAX_VIDEO_SIZE,
  MAX_AUDIO_SIZE,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_AUDIO_TYPES
} from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    const fileType = file.type;
    const isImage = ALLOWED_IMAGE_TYPES.includes(fileType);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(fileType);
    const isAudio = ALLOWED_AUDIO_TYPES.includes(fileType);

    if (!isImage && !isVideo && !isAudio) {
      return NextResponse.json(
        { success: false, error: "Unsupported file type" },
        { status: 400 }
      );
    }

    // Size validation
    if (isImage && file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: "Image too large (max 5MB)" }, { status: 400 });
    }
    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json({ success: false, error: "Video too large (max 10MB)" }, { status: 400 });
    }
    if (isAudio && file.size > MAX_AUDIO_SIZE) {
      return NextResponse.json({ success: false, error: "Audio too large (max 5MB)" }, { status: 400 });
    }

    if (isImage) {
      // Convert file to base64 for ImgBB
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString("base64");

      const uploadFormData = new FormData();
      uploadFormData.append("key", IMGBB_API_KEY);
      uploadFormData.append("image", base64);

      const response = await fetch(IMGBB_API_URL, {
        method: "POST",
        body: uploadFormData,
      });

      const data = (await response.json()) as any;
      if (!data.success) throw new Error("ImgBB upload failed");

      return NextResponse.json({
        success: true,
        type: "image",
        url: data.data.url,
        thumbnail: data.data.thumb?.url,
      });
    } else {
      // Upload to Cloudinary using REST API
      const resourceType = isVideo ? "video" : "audio";
      
      // We need a signature for signed uploads, but for simplicity here we might use unsigned if the user configured it,
      // HOWEVER the user gave us API Secret, so we should do a signed upload if possible.
      // But signed uploads are hard in Edge without crypto.subtle.
      // Let's use unsigned upload with the "ml_default" or similar if they have it, 
      // OR try to do a simple signed upload if we have the secret.
      
      // For now, let's assume they want a signed upload and we have to implement the signature.
      const timestamp = Math.round(new Date().getTime() / 1000);
      const signatureStr = `timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
      
      // Simple SHA-1 signature (Edge compatible)
      const msgUint8 = new TextEncoder().encode(signatureStr);
      const hashBuffer = await crypto.subtle.digest("SHA-1", msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const signature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      const cloudFormData = new FormData();
      cloudFormData.append("file", file);
      cloudFormData.append("api_key", CLOUDINARY_API_KEY);
      cloudFormData.append("timestamp", timestamp.toString());
      cloudFormData.append("signature", signature);

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
      
      const response = await fetch(cloudinaryUrl, {
        method: "POST",
        body: cloudFormData,
      });

      const data = (await response.json()) as any;
      if (data.error) throw new Error(data.error.message);

      return NextResponse.json({
        success: true,
        type: resourceType,
        url: data.secure_url,
        duration: data.duration,
      });
    }
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
