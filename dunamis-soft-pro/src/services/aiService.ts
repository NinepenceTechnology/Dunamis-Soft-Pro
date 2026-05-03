import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const predictSales = async (historicalData: any[]) => {
  try {
    const prompt = `Based on the following historical sales data, predict the sales for the next 7 days. Return the result as a JSON array of objects with 'date' and 'predictedSales'.
    Data: ${JSON.stringify(historicalData)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
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

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Prediction failed:", error);
    return [];
  }
};

export const aiService = {
  predictSales
};
