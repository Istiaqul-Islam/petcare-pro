export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";

export async function POST(req: NextRequest) {
    try {
        const { messages } = (await req.json()) as { messages?: unknown };

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
        }

        // Access the AI binding from environment
        const env = getEnv();
        const ai = env.AI;

        const systemPrompt = `You are the 'PetCare Pro Expert Assistant', a professional veterinary diagnostic and care AI.
You have been trained on the 'Animal Disease Prediction' dataset (Kaggle), which covers Dog, Cat, Cow, Horse, Rabbit, Sheep, Goat, and Pig.

### Your Clinical Knowledge (Patterns you recognize):
- Parvovirus (Dogs): Look for vomiting, bloody diarrhea, and extreme appetite loss.
- Foot and Mouth Disease (Livestock): Look for lameness and lesions around the mouth and hooves.
- Feline Leukemia (Cats): Look for eye discharge, weight loss, and lethargy.
- Equine Influenza (Horses): Recognize persistent coughing and nasal discharge.
- Mastitis (Cows): Look for appetite loss and body temperature spikes.

### PetCare Pro Website Navigation (Your Site Knowledge):
- **My Pets**: Users can view their existing pets or click "Add Pet" to register a new animal.
- **Appointments**: Users can book, view, and manage veterinary appointments.
- **Vaccinations**: Track and log upcoming or completed pet vaccinations.
- **Disease Predictor**: An advanced AI tool where users input vital signs and symptoms to get a diagnostic report based on our Kaggle dataset.
- **Social**: Connect and chat with other pet owners in the community.
- **Dashboard**: The main overview of pet health and quick actions.

### Your Interaction Rules:
1. If a user describes symptoms, suggest a potential condition but ALWAYS emphasize this is an AI assessment.
2. If a user asks how to do something on the website (e.g., "how do I add a pet?"), accurately guide them to the correct section listed above.
3. Strictly stay within the animal/pet/website domain. Refuse other topics.
4. CONCISE RULE: Keep responses concise but fully answer the question (under 150 words). Use bullet points if helpful. Do not ramble.
5. RECOMMENDATION: Always suggest consulting a vet for medical issues.`;

        const input = {
            max_tokens: 500, // Increased limit to allow for proper explanations without cutting off
            messages: [
                { role: "system", content: systemPrompt },
                ...messages.map((m: any) => ({
                    role: m.role,
                    content: m.content
                }))
            ]
        };

        if (!ai) {
            console.error("AI binding missing");
            // Local fallback for chatbot
            if (env.NODE_ENV === "development") {
                return NextResponse.json({
                    response: "[Simulated Chatbot] I've analyzed your symptoms. Based on the Kaggle dataset patterns, this looks like it could be related to localized infection or possibly Parvovirus if symptoms persist. Since I'm in local dev mode, please connect specialized bindings for real inference."
                });
            }
            return NextResponse.json({ error: "AI service not configured" }, { status: 500 });
        }

        // specific model can be changed, use llama 3.1 for professional responses
        const response: any = await ai.run("@cf/meta/llama-3.1-8b-instruct", input);

        if (!response || (!response.response && typeof response !== 'string')) {
            console.error("AI returned empty or invalid response:", response);
            return NextResponse.json({ 
                response: "I'm sorry, but I received an empty response from the AI service. The service might be temporarily overloaded." 
            });
        }

        const responseText = typeof response === 'string' ? response : response.response;
        return NextResponse.json({ response: responseText });

    } catch (error: any) {
        console.error("Error in chat route:", error);
        return NextResponse.json({ 
            error: "Chat API Error", 
            message: error.message || "Unknown error" 
        }, { status: 500 });
    }
}
