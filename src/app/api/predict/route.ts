export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";

const HFS_API_URL = "https://istiaq666-predict-disease.hf.space/predict";

interface PredictRequest {
  animalType: string;
  breed: string;
  age: string;
  gender: string;
  weight: string;
  duration: string;
  temp: string;
  heartRate: string;
  symptom1: string;
  symptom2: string;
  symptom3: string;
  symptom4: string;
  binarySymptoms: {
    diarrhea: boolean;
    coughing: boolean;
    labored_breathing: boolean;
    lameness: boolean;
    skin_lesions: boolean;
    nasal_discharge: boolean;
    eye_discharge: boolean;
  };
}

export async function POST(req: NextRequest) {
  try {
    const data = (await req.json()) as PredictRequest;

    // 1. Map Frontend data to the 19 features expected by the ML model
    const payload = {
      "Animal_Type": data.animalType,
      "Breed": data.breed || "Unknown",
      "Age": data.age || "0",
      "Gender": data.gender || "Male",
      "Weight": data.weight || "0",
      "Symptom_1": data.symptom1 || "No",
      "Symptom_2": data.symptom2 || "No",
      "Symptom_3": data.symptom3 || "No",
      "Symptom_4": data.symptom4 || "No",
      "Duration": data.duration || "0 days",
      "Diarrhea": data.binarySymptoms?.diarrhea ? "Yes" : "No",
      "Coughing": data.binarySymptoms?.coughing ? "Yes" : "No",
      "Labored_Breathing": data.binarySymptoms?.labored_breathing ? "Yes" : "No",
      "Lameness": data.binarySymptoms?.lameness ? "Yes" : "No",
      "Skin_Lesions": data.binarySymptoms?.skin_lesions ? "Yes" : "No",
      "Nasal_Discharge": data.binarySymptoms?.nasal_discharge ? "Yes" : "No",
      "Eye_Discharge": data.binarySymptoms?.eye_discharge ? "Yes" : "No",
      "Body_Temperature": data.temp ? `${data.temp}°C` : "38.5°C",
      "Heart_Rate": data.heartRate || "100"
    };

    // 2. Call the Hugging Face Space API
    const response = await fetch(HFS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ML Service Error: ${errorText}`);
    }

    const result = await response.json();

    // 3. Transform ML result into the format expected by the frontend
    // Since we are not using Llama, we provide static or derived analysis
    return NextResponse.json({
      prediction: result.prediction,
      confidence: result.confidence,
      analysis: `The diagnostic model identified ${result.prediction} based on the clinical symptoms and vital signs provided.`,
      recommendations: [
        "Consult a certified veterinarian for a physical examination.",
        "Monitor vital signs and behavior closely for the next 24-48 hours.",
        "Ensure the animal has access to fresh water and a quiet environment."
      ],
      status: "success"
    });

  } catch (error: any) {
    console.error("Prediction API Error:", error);
    return NextResponse.json({ 
      error: "Prediction API Error",
      message: error.message || "Unknown error"
    }, { status: 500 });
  }
}
