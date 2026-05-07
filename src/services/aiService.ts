import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'undefined') {
       console.warn("GEMINI_API_KEY is missing. AI features will be disabled.");
       return null;
    }
    aiInstance = new GoogleGenAI(apiKey);
  }
  return aiInstance;
};

export const predictSales = async (historicalData: any[]) => {
  try {
    const ai = getAI();
    if (!ai) return [];

    const prompt = `Based on the following historical sales data, predict the sales for the next 7 days. Return the result as a JSON array of objects with 'date' and 'predictedSales'.
    Data: ${JSON.stringify(historicalData)}`;

    const response = await ai.getGenerativeModel({
      model: "gemini-1.5-flash",
    }).generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              predictedSales: { type: Type.NUMBER }
            },
            required: ["date", "predictedSales"]
          }
        }
      }
    });

    const result = response.response.text();
    return JSON.parse(result);
  } catch (error) {
    console.error("AI Prediction failed:", error);
    return [];
  }
};

export const aiService = {
  predictSales
};
