import { GoogleGenAI } from "@google/genai";

async function test() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "Set (length: " + process.env.GEMINI_API_KEY.length + ")" : "Not set");
  console.log("API_KEY:", process.env.API_KEY ? "Set (length: " + process.env.API_KEY.length + ")" : "Not set");
  
  if (!apiKey) {
    console.error("No API key found.");
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Hello",
    });
    console.log("Success:", response.text);
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
