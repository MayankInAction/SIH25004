import { GoogleGenAI, Type, GenerateContentResponse, Chat } from "@google/genai";
import { Species, ChatMessage } from '../types';
import { CATTLE_BREEDS, BUFFALO_BREEDS } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("Gemini API key is not set. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });
let breedChatInstance: Chat | null = null;
let generalChatInstance: Chat | null = null;


const breedIdSchema = {
  type: Type.OBJECT,
  properties: {
    error: { 
      type: Type.STRING, 
      description: "Error message if validation fails (e.g., blurry image, multiple animals, species mismatch). Set to 'null' as a string if successful.",
    },
    breedName: { type: Type.STRING, description: "The most likely breed name from the provided list." },
    confidence: { type: Type.STRING, description: "Confidence level: 'High', 'Medium', or 'Low'." },
    milkYieldPotential: { type: Type.STRING, description: "A brief summary of the breed's milk yield potential." },
    careNotes: { type: Type.STRING, description: "A short paragraph on general care and management." },
    reasoning: { type: Type.STRING, description: "Brief explanation for the identification based on visual traits." },
  },
  required: ['error', 'breedName', 'confidence', 'milkYieldPotential', 'careNotes', 'reasoning'],
};

export const identifyBreed = async (images: { mimeType: string; data: string }[], species: Species) => {
  const breedList = species === 'Cattle' ? CATTLE_BREEDS : BUFFALO_BREEDS;

  const prompt = `
    Analyze the attached image(s) of a single animal for breed identification.

    First, perform these critical validation checks:
    1.  **Species Consistency:** Verify the animal is a ${species}. If not, set the 'error' field.
    2.  **Single Animal Check:** Confirm all images are of the same animal. If not, set the 'error' field.
    3.  **Image Quality:** Assess if images are clear enough. If blurry, obstructed, or at poor angles, set the 'error' field.

    If all checks pass, identify the breed from this list: [${breedList.join(', ')}].
    Provide your response strictly in the specified JSON format. If no error, the 'error' field must be the string 'null'.
  `;

  const imageParts = images.map(image => ({
    inlineData: {
      mimeType: image.mimeType,
      data: image.data,
    },
  }));

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [...imageParts, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: breedIdSchema,
        },
    });

    const jsonText = response.text;
    const result = JSON.parse(jsonText);
    
    if(result.error && result.error.toLowerCase() === 'null') {
      result.error = null;
    }
    
    return result;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return {
      error: "Failed to communicate with AI service. Please check your connection and API key.",
      breedName: "Unknown",
      confidence: "Low",
      milkYieldPotential: "N/A",
      careNotes: "N/A",
      reasoning: "An error occurred during AI analysis.",
    };
  }
};

const animalDetailsSchema = {
    type: Type.OBJECT,
    properties: {
        error: {
            type: Type.STRING,
            description: "Error message if detection fails (e.g., unclear image). Set to 'null' as a string if successful.",
        },
        animals: {
            type: Type.ARRAY,
            description: "An array of all detected cattle or buffalo in the image.",
            items: {
                type: Type.OBJECT,
                properties: {
                    species: {
                        type: Type.STRING,
                        description: "The identified species. Must be either 'Cattle' or 'Buffalo'.",
                        enum: ['Cattle', 'Buffalo']
                    },
                    sex: {
                        type: Type.STRING,
                        description: "The identified sex. Must be either 'Male' or 'Female'.",
                        enum: ['Male', 'Female']
                    },
                },
                required: ['species', 'sex']
            }
        }
    },
    required: ['error', 'animals'],
};

export const detectAnimalDetails = async (image: { mimeType: string; data: string }) => {
    const prompt = `
    Analyze the attached image to identify all instances of cattle and buffalo.
    For each animal found, determine its species ('Cattle' or 'Buffalo') and sex ('Male' or 'Female').

    To improve sex accuracy, look for these features:
    - **For 'Male'**: Look for the presence of a preputial sheath (pizzle) under the belly, a more pronounced hump (in Zebu cattle), and a generally more muscular build, especially in the neck and shoulders. The absence of a developed udder is a strong indicator.
    - **For 'Female'**: Look for the presence of an udder and teats between the hind legs. If the animal is young (a heifer), the udder may be small, but it should still be distinguishable.

    - If the image is unclear, obstructed, or the key sex features are not visible, set the 'error' field.
    - If no animals are found in a clear image, return an empty 'animals' array.
    
    Provide your response strictly in the specified JSON format. If no error, the 'error' field must be the string 'null'.
  `;

    const imagePart = {
        inlineData: {
            mimeType: image.mimeType,
            data: image.data,
        },
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: animalDetailsSchema,
            },
        });

        const jsonText = response.text;
        const result = JSON.parse(jsonText);

        if (result.error && result.error.toLowerCase() === 'null') {
            result.error = null;
        }

        return result;

    } catch (error) {
        console.error("Error calling Gemini API for detail detection:", error);
        return {
            error: "Failed to auto-detect details from image.",
            animals: [],
        };
    }
};


export const getBreedFacts = async (breedName: string, species: Species) => {
    const prompt = `Provide detailed facts about the ${breedName} ${species} breed, focusing on its context within India. Include information on:
-   Origin and native tract
-   Physical characteristics (e.g., color, horns, build)
-   Temperament and behavior
-   Primary use (dairy, draught, dual-purpose)
-   Milk yield potential or draught capabilities
-   Special attributes or unique traits
-   Climatic suitability`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const facts = response.text;
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
        
        const sources = groundingChunks
            .map(chunk => chunk.web)
            .filter((web): web is { uri: string; title: string } => !!(web && web.uri));
            
        return {
            facts,
            sources,
            error: null,
        };

    } catch (error) {
        console.error("Error fetching breed facts with Google Search:", error);
        return {
            facts: "Could not retrieve detailed information for this breed at the moment. Please try again later.",
            sources: [],
            error: "Failed to communicate with the AI service.",
        };
    }
};

export const startChat = (breedName: string) => {
    breedChatInstance = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: `You are a helpful veterinary assistant specializing in Indian livestock. Your knowledge is focused on the ${breedName} breed. Answer questions clearly and concisely for field workers. Cover topics like care, common diseases, productivity, and nutrition.`,
        },
    });
};

export const sendMessageToChat = async (message: string): Promise<string> => {
    if (!breedChatInstance) {
        return "Chat not initialized. Please start a new chat session.";
    }

    try {
        const response: GenerateContentResponse = await breedChatInstance.sendMessage({ message });
        return response.text;
    } catch (error) {
        console.error("Error sending message to chat:", error);
        return "Sorry, I encountered an error. Please try again.";
    }
};

// --- General Chatbot Functions ---

export const startGeneralChat = () => {
    if (!generalChatInstance) {
        generalChatInstance = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: `You are पशुHelper, a friendly and knowledgeable AI assistant for veterinary field workers in India. Your expertise covers two main areas: 1. **Indian Livestock:** You can answer questions about all recognized Indian cattle and buffalo breeds, including their care, productivity, and health. 2. **The PashuVision App:** You are an expert on this application. You can guide users on how to use the app, including how to perform new registrations, view history, understand the dashboard, use the AI for breed identification, and update records. Always provide clear, practical, and concise answers, prioritizing animal welfare and standard veterinary practices when applicable.`,
            },
        });
    }
};


export const sendMessageToGeneralChat = async (message: string): Promise<string> => {
    if (!generalChatInstance) {
        startGeneralChat();
    }
    
    try {
        const response: GenerateContentResponse = await generalChatInstance!.sendMessage({ message });
        return response.text;
    } catch (error) {
        console.error("Error sending message to general chat:", error);
        return "Sorry, I'm having trouble connecting right now. Please try again later.";
    }
};