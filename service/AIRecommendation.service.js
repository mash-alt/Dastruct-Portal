import { GoogleGenAI } from "@google/genai";
import { configDotenv } from "dotenv";

configDotenv();

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: "I failed Quameth101 but passed Datastructures101, theres a subject with datastructure as a prerequisite, its IMBSys101 what subjects can i take the following semester?",
    generationConfig: {
        temperature: 0.1, // Value between 0.0 and 1.0
      }
  });
  console.log(response.text);
}

main();

