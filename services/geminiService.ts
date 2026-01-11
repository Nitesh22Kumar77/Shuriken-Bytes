
import { GoogleGenAI, Type } from "@google/genai";
import { Memory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const extractSemantics = async (text: string): Promise<Partial<Memory>> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Extract semantic information from the following text: "${text}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          entities: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Nouns and key subjects mentioned."
          },
          actions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Verbs or actions mentioned."
          },
          namedEntities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING, description: "Person, Location, Organization, etc." }
              }
            }
          },
          sentiment: {
            type: Type.STRING,
            description: "One of: positive, negative, neutral"
          },
          sentimentScore: {
            type: Type.NUMBER,
            description: "Score from -1 (very negative) to 1 (very positive)"
          },
          summary: {
            type: Type.STRING,
            description: "A very brief 1-sentence summary of the memory."
          }
        },
        required: ["entities", "actions", "sentiment", "sentimentScore", "summary"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text || "{}");
    return data;
  } catch (error) {
    console.error("Failed to parse semantic extraction response:", error);
    return {};
  }
};

export const queryMemories = async (query: string, memories: Memory[]): Promise<{ id: string; reason: string; score: number }[]> => {
  if (memories.length === 0) return [];

  const context = memories.map(m => `ID: ${m.id} | Summary: ${m.summary} | Text: ${m.text}`).join("\n");
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Given the following list of stored memories, identify which ones are most relevant to the query: "${query}"
    
    Memories:
    ${context}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            reason: { type: Type.STRING, description: "Why this memory is relevant." },
            score: { type: Type.NUMBER, description: "Relevance score from 0 to 1." }
          },
          required: ["id", "reason", "score"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Failed to parse query response:", error);
    return [];
  }
};

export const generateIntelligentResponse = async (query: string, relevantMemories: Memory[]): Promise<string> => {
  const context = relevantMemories.map(m => m.text).join("\n---\n");
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are an AI assistant with access to the user's past memories. 
    The user is asking: "${query}"
    
    Here are relevant snippets from their memory:
    ${context}
    
    Synthesize a warm, intelligent response based on these memories. If the memories aren't quite enough, acknowledge what you know and ask for clarification.`,
  });

  return response.text || "I'm sorry, I couldn't process that.";
};
