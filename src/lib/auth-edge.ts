// src/lib/auth-edge.ts
// Purpose: Lightweight Firebase ID Token verification for Edge Runtime.
// Uses 'jose' instead of 'firebase-admin' to ensure compatibility with Cloudflare Pages Edge.

import * as jose from "jose";

export async function verifyFirebaseIdToken(token: string) {
  const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!FIREBASE_PROJECT_ID) {
    console.error("❌ NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set in environment");
    throw new Error("Server configuration error: Firebase Project ID missing");
  }

  // 1. Fetch Google's public keys for Firebase
  const response = await fetch(
    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
  );
  const publicKeys: Record<string, string> = await response.json();

  // 2. Decode the token without verification to get the kid (Key ID)
  const header = jose.decodeProtectedHeader(token);
  const kid = header.kid;

  if (!kid || !publicKeys[kid]) {
    throw new Error("Invalid token header or key ID");
  }

  // 3. Convert the x509 certificate to a usable key
  const certificate = publicKeys[kid];
  const publicKey = await jose.importX509(certificate, "RS256");

  // 4. Verify the token
  const { payload } = await jose.jwtVerify(token, publicKey, {
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    audience: FIREBASE_PROJECT_ID,
  });

  // 5. Ensure the token was signed with the correct algorithm
  if (header.alg !== "RS256") {
    throw new Error("Invalid signing algorithm");
  }

  // 6. Check if email is verified in the token
  if (!payload.email_verified) {
    throw new Error("Email is not verified in Firebase");
  }

  return {
    uid: payload.sub,
    email: payload.email as string,
    emailVerified: payload.email_verified as boolean,
  };
}
