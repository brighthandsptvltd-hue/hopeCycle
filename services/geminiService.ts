
import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. AI features will be disabled.");
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

export const geminiService = {
  async suggestDonationCategory(title: string, description: string) {
    const ai = getAI();
    if (!ai) return { category: "Other", confidence: 0 };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: `Based on this donation title: "${title}" and description: "${description}", suggest the most appropriate category (e.g., Furniture, Clothing, Electronics, Books, Food, Medical, Household, Toys).`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              confidence: { type: Type.NUMBER }
            }
          }
        }
      });
      return JSON.parse(response.text);
    } catch (error) {
      console.error("Gemini Suggestion Error:", error);
      return { category: "Other", confidence: 0 };
    }
  },

  async generateMissionStatement(ngoName: string, focus: string) {
    const ai = getAI();
    if (!ai) return "Dedicated to serving the community through sustainable efforts.";

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: `Generate a compelling one-paragraph mission statement for an NGO named "${ngoName}" that focuses on "${focus}". Keep it professional yet inspiring.`,
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Generation Error:", error);
      return "Dedicated to serving the community through sustainable efforts.";
    }
  },

  async assistChatResponse(message: string, context: string) {
    const ai = getAI();
    if (!ai) return "Thanks for your response! I'll get back to you shortly.";

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: `You are an AI assistant helping a donor communicate with an NGO about a donation. The NGO said: "${message}". Context: ${context}. Suggest a polite, clear response.`,
      });
      return response.text;
    } catch (error) {
      return "Thanks for your response! I'll get back to you shortly.";
    }
  }
};
