// lib/creative-director.ts

import { GoogleGenAI, Type } from "@google/genai";
import { Magazine } from "./magazines";
import { getRandom, MOOD_POOL } from "./generation-pools";

export interface CreativeBrief {
  headline: string;
  sublines: string[];
  clothing: string;
  pose: string;
  expression: string;
  backgroundMood: string;
}

// Fallback за dev mode ако Phase 1 fail-не
export function generateFallbackBrief(magazine: Magazine): CreativeBrief {
  return {
    headline: getRandom(magazine.referenceHeadlines),
    sublines: getRandomSublines(magazine),
    clothing: magazine.clothingGuide.split('.')[0], // Взема първото изречение
    pose: magazine.poseGuide.split('.')[0],
    expression: "Confident, looking directly into camera",
    backgroundMood: getRandom(MOOD_POOL),
  };
}

function getRandomSublines(magazine: Magazine): string[] {
  const count = magazine.sublineCount.min + 
    Math.floor(Math.random() * (magazine.sublineCount.max - magazine.sublineCount.min + 1));
  const shuffled = [...magazine.referenceSublines].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export async function generateCreativeBrief(
  apiKey: string,
  magazine: Magazine,
  gender: "male" | "female" | "unisex"
): Promise<CreativeBrief> {
  const ai = new GoogleGenAI({ apiKey });

  const systemPrompt = `${magazine.editorialPersona}

You are creating the creative brief for the next cover of ${magazine.name} magazine.

TARGET AUDIENCE: ${magazine.targetAudience}
TONE: ${magazine.tone}
FOCUS: ${magazine.focus}

STRICT RULES FOR HEADLINES:
${magazine.headlineRules}

ALLOWED SUBLINE CATEGORIES: ${magazine.sublineCategories.join(", ")}

CLOTHING DIRECTION: ${magazine.clothingGuide}

POSE DIRECTION: ${magazine.poseGuide}

The cover star is a ${gender === "unisex" ? "person" : gender === "male" ? "man" : "woman"}.

Generate a UNIQUE creative brief. Do NOT repeat these reference examples, but match their STYLE and TONE:
Reference headlines (for style only, DO NOT copy): ${magazine.referenceHeadlines.slice(0, 5).join(", ")}
Reference sublines (for style only, DO NOT copy): ${magazine.referenceSublines.slice(0, 5).join(", ")}

Respond in VALID JSON ONLY, no markdown, no explanation:
{
  "headline": "one main cover headline following the rules above",
  "sublines": ["array of ${magazine.sublineCount.min} to ${magazine.sublineCount.max} sublines, each starting with CATEGORY | text"],
  "clothing": "specific clothing description for this cover star, matching the brand aesthetic",
  "pose": "specific pose description for this cover star",
  "expression": "specific facial expression description",
  "backgroundMood": "specific background/mood description"
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: systemPrompt,
    config: {
      temperature: 1.0, // Висока за креативност
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          headline: { type: Type.STRING, description: "Main cover headline" },
          sublines: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: `Array of ${magazine.sublineCount.min} to ${magazine.sublineCount.max} sublines`
          },
          clothing: { type: Type.STRING, description: "Clothing description" },
          pose: { type: Type.STRING, description: "Pose description" },
          expression: { type: Type.STRING, description: "Facial expression description" },
          backgroundMood: { type: Type.STRING, description: "Background/mood description" }
        },
        required: ["headline", "sublines", "clothing", "pose", "expression", "backgroundMood"]
      }
    },
  });

  const text = response.text || "";
  
  try {
    const brief = JSON.parse(text) as CreativeBrief;
    
    // Валидация
    if (!brief.headline || !brief.sublines || !Array.isArray(brief.sublines)) {
      throw new Error("Invalid brief structure");
    }
    
    // Подсигуряване на правилен брой sublines
    if (brief.sublines.length < magazine.sublineCount.min) {
      // Допълни от reference ако липсват
      const needed = magazine.sublineCount.min - brief.sublines.length;
      const extras = magazine.referenceSublines
        .filter(s => !brief.sublines.includes(s))
        .sort(() => 0.5 - Math.random())
        .slice(0, needed);
      brief.sublines.push(...extras);
    }
    if (brief.sublines.length > magazine.sublineCount.max) {
      brief.sublines = brief.sublines.slice(0, magazine.sublineCount.max);
    }
    
    return brief;
  } catch (e) {
    console.error("Phase 1 JSON parse error:", e, "Raw:", text);
    throw new Error("Failed to parse creative brief");
  }
}
