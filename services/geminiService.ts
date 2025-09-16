
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

const animalDetailSchema = {
    type: Type.OBJECT,
    properties: {
        error: {
            type: Type.STRING,
            description: "Error message if detection fails (e.g., not an animal, unclear image). Set to 'null' as a string if successful.",
        },
        species: {
            type: Type.STRING,
            description: "The identified species. Must be either 'Cattle' or 'Buffalo'.",
            enum: ['Cattle', 'Buffalo']
        },
        gender: {
            type: Type.STRING,
            description: "The identified gender. Must be either 'Male' or 'Female'.",
            enum: ['Male', 'Female']
        },
    },
    required: ['error', 'species', 'gender'],
};

export const detectAnimalDetails = async (image: { mimeType: string; data: string }) => {
    const prompt = `
    Analyze the attached image of a single animal.
    1.  Identify the species. It must be one of: ['Cattle', 'Buffalo'].
    2.  Identify the gender. It must be one of: ['Male', 'Female'].
    3.  Assess if the image is clear enough for identification. If not, or if it's not a cow or buffalo, set the 'error' field.
    
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
                responseSchema: animalDetailSchema,
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
            species: null,
            gender: null,
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
                systemInstruction: `You are पशुHelper, a friendly and knowledgeable AI assistant for veterinary field workers in India. Your expertise covers all recognized Indian cattle and buffalo breeds. Provide clear, practical, and concise answers. When asked for advice, prioritize animal welfare and standard veterinary practices.`,
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