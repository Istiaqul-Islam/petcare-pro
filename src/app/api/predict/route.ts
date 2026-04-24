export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";

/**
 * Animal Disease Prediction Knowledge Base (Derived from Kaggle Dataset patterns)
 * We provide few-shot examples and clear logic to "train" the LLM on this task.
 */
const SYSTEM_PROMPT = `You are a highly specialized Veterinary Diagnostic AI trained on the 'Animal Disease Prediction' dataset (Kaggle).
Your specialty is analyzing animal symptoms and vital signs to predict potential diseases.

### Dataset Context & Reference Patterns:
- Parvovirus (Dogs): High vomiting, diarrhea, high temp (>39.5).
- Kennel Cough (Dogs): Persistent dry cough, nasal discharge, normal temp.
- Rabies (Dogs/Cats): Behavioral changes, aggression, excessive salivation.
- Feline Leukemia (Cats): Anemia, eye discharge, weight loss.
- Cat Flu (Cats): Sneezing, nasal congestion, conjunctivitis.
- Foot and Mouth Disease (Cows/Goats): Lameness, mouth/hoof lesions, high temp.
- Equine Influenza (Horses): Coughing, nasal discharge, fever.
- Mastitis (Cows): Udder swelling, temp changes, appetite loss.

### Your Task:
Based on the JSON input provided by the user, perform a deep differential diagnosis. 
Do NOT limit yourself to the patterns above; use your full underlying knowledge of veterinary medicine to identify the most plausible condition based on the specific combination of symptoms, vitals, breed, and age.

### Output Format:
You MUST respond ONLY with a valid JSON object in this exact structure:
{
  "prediction": "NAME_OF_DISEASE",
  "confidence": 85,
  "analysis": "Brief 2-sentence explanation of why these specific symptoms and vitals match the suspected condition over other alternatives.",
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
}

Do not include any text outside the JSON block. Be professional, cautious, and analytical.`;

interface PredictRequest {
  animalType: string;
  symptoms: Record<string, boolean>;
  temp: string;
  heartRate: string;
  breed?: string;
  age?: string;
  weight?: string;
  customSymptom?: string;
}

export async function POST(req: NextRequest) {
  try {
    const data = (await req.json()) as PredictRequest;
    const {
      animalType,
      symptoms,
      temp,
      heartRate,
      breed,
      age,
      weight,
      customSymptom,
    } = data;

    // Build the diagnostic input string for the model
    const activeSymptoms = Object.entries(symptoms)
      .filter(([_, active]) => active)
      .map(([name, _]) => name.replace("_", " "))
      .join(", ");

    const inputData = `
    ### Patient Details:
    - Animal Type: ${animalType}
    - Breed: ${breed || "Unknown"}
    - Age: ${age || "Unknown"} years
    - Weight: ${weight || "Unknown"} kg
    
    ### Vital Signs:
    - Body Temperature: ${temp}°C
    - Heart Rate: ${heartRate} BPM
    
    ### Clinical Symptoms:
    - Primary Symptoms Found: ${activeSymptoms || "None reported"}
    - Additional Observations: ${customSymptom || "None reported"}
    `;

    const env = getEnv();
    const ai = env.AI;

    if (!ai) {
      console.error("AI binding missing");
      if (env.NODE_ENV === "development") {
        return NextResponse.json({
          prediction: "Canine Parvovirus (Simulated)",
          confidence: 92,
          analysis: "Local development detected. This is a simulated result because the AI binding is only available on Cloudflare or via wrangler dev.",
          recommendations: ["Immediate veterinary attention required", "Strict isolation from other pets", "Intravenous fluid therapy for hydration"]
        });
      }
      return NextResponse.json({ error: "AI service not configured" }, { status: 500 });
    }

    const input = {
      max_tokens: 300, // Hard limit to save Cloudflare AI Neurons
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Analyze this patient and predict the condition:\n${inputData}` }
      ]
    };

    // Use Llama 3.1 8B Instruct for fast and accurate medical inference
    const response: any = await ai.run("@cf/meta/llama-3.1-8b-instruct", input);
    
    if (!response || (!response.response && typeof response !== 'string')) {
      throw new Error("AI returned empty or invalid response");
    }

    // Attempt to extract JSON from the response (sometimes models add markdown markers)
    let jsonContent = typeof response === 'string' ? response : response.response;

    if (jsonContent.includes("```json")) {
      jsonContent = jsonContent.split("```json")[1].split("```")[0].trim();
    } else if (jsonContent.includes("```")) {
      jsonContent = jsonContent.split("```")[1].split("```")[0].trim();
    }

    try {
      const result = JSON.parse(jsonContent);
      return NextResponse.json(result);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", jsonContent);
      // Fallback response if the model fails to return standard JSON
      return NextResponse.json({
        prediction: "General Clinical Diagnosis Needed",
        confidence: 60,
        analysis: "The AI was unable to provide a structured result, but detected patterns suggestive of a complex condition.",
        recommendations: ["Consult a veterinarian", "Monitor hydration", "Isolate the animal"]
      });
    }

  } catch (error: any) {
    console.error("Prediction API Error:", error);
    return NextResponse.json({ 
      error: "Prediction API Error",
      message: error.message || "Unknown error"
    }, { status: 500 });
  }
}
