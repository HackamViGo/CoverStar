// lib/creative-director.ts

import { GoogleGenAI, Type } from "@google/genai";
import { Magazine } from "./magazines";
import { getRandom, MOOD_POOL } from "./generation-pools";

export interface CreativeBrief {
  editorialConcept: {
    thoughtProcess: string;
    colorPalette: string;
  };
  coverCopy: {
    mainHeadline: string;
    subtitles: Array<{
      text: string;
      typographyWeight: string;
    }>;
    layoutInstructions: string;
  };
  photographyDirection: {
    clothingAndStyling: string;
    lightingStyle: string;
    poseAndExpression: string;
    backgroundAndSet: string;
  };
}

// Fallback за dev mode ако Phase 1 fail-не
export function generateFallbackBrief(magazine: Magazine): CreativeBrief {
  return {
    editorialConcept: {
      thoughtProcess: "Fallback concept matching magazine aesthetic.",
      colorPalette: `${magazine.primaryColor}, ${magazine.accentColor}`
    },
    coverCopy: {
      mainHeadline: getRandom(magazine.referenceHeadlines),
      subtitles: getRandomSublines(magazine).map(s => ({ text: s, typographyWeight: "regular" })),
      layoutInstructions: "Standard layout"
    },
    photographyDirection: {
      clothingAndStyling: magazine.clothingGuide.split('.')[0],
      lightingStyle: magazine.lightingDna.split('.')[0],
      poseAndExpression: magazine.poseGuide.split('.')[0],
      backgroundAndSet: getRandom(MOOD_POOL),
    }
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
  gender: "male" | "female" | "unisex",
  topic?: string
): Promise<CreativeBrief> {
  const ai = new GoogleGenAI({ apiKey });

  const systemInstructions = `
${magazine.editorialPersona}

You are the Executive Art Director producing the next cover of ${magazine.name}.
Your job is to conceptualize a visual and editorial masterpiece that matches the magazine's DNA.

TARGET AUDIENCE: ${magazine.targetAudience}
TONE: ${magazine.tone}
FOCUS: ${magazine.focus}

COVER STAR: A ${gender === "unisex" ? "person" : gender === "male" ? "man" : "woman"}.
${topic ? `THEME/TOPIC: ${topic}` : ""}

STEP 1: EDITORIAL CONCEPT
First, document your 'editorialConcept'. Why are you choosing this specific fashion, lighting, and copy? How do they work together to create a stunning cover? Be a visionary.

STEP 2: TYPOGRAPHY & COPY (coverCopy)
- 1 Main Headline (STRICT RULE: ${magazine.headlineRules})
- ${magazine.sublineCount.min} to ${magazine.sublineCount.max} subtitles. Allowed categories: ${magazine.sublineCategories.join(", ")}

STEP 3: PHOTOGRAPHY & STYLE (photographyDirection)
- Clothing: Must match ${magazine.clothingGuide}. Be specific about fabrics and fit.
- Pose & Expression: ${magazine.poseGuide}. Describe the body language.
- Lighting & Background: Match ${magazine.lightingDna}.

CRITICAL RULES:
1. AVOID CLICHES. Do not use generic terms like "nice dress" or "cool pose". Use professional fashion and photography terminology.
2. The clothing MUST harmonize with the lighting and background.
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Create the final cover brief.",
    config: {
      systemInstruction: systemInstructions,
      temperature: 0.9,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          editorialConcept: {
            type: Type.OBJECT,
            properties: {
              thoughtProcess: { type: Type.STRING, description: "Обяснение защо избираш тези елементи според ДНК на списанието и пола" },
              colorPalette: { type: Type.STRING, description: "Конкретна палитра с hex кодове ако е възможно" }
            },
            required: ["thoughtProcess", "colorPalette"]
          },
          coverCopy: {
            type: Type.OBJECT,
            properties: {
              mainHeadline: { type: Type.STRING, description: "Име на списанието или основно мото" },
              subtitles: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING, description: "Текст на подзаглавието" },
                    typographyWeight: { type: Type.STRING, description: "bold/regular/light" }
                  },
                  required: ["text", "typographyWeight"]
                }
              },
              layoutInstructions: { type: Type.STRING, description: "Къде точно да се постави текста" }
            },
            required: ["mainHeadline", "subtitles", "layoutInstructions"]
          },
          photographyDirection: {
            type: Type.OBJECT,
            properties: {
              clothingAndStyling: { type: Type.STRING, description: "Изключително специфично описание на дрехите" },
              lightingStyle: { type: Type.STRING, description: "Професионална терминология за осветлението" },
              poseAndExpression: { type: Type.STRING, description: "Конкретна поза и излъчване" },
              backgroundAndSet: { type: Type.STRING, description: "Точно описание на фона със hex кодове" }
            },
            required: ["clothingAndStyling", "lightingStyle", "poseAndExpression", "backgroundAndSet"]
          }
        },
        required: ["editorialConcept", "coverCopy", "photographyDirection"]
      }
    },
  });

  const text = response.text || "";
  
  try {
    let cleanText = text.trim();
    if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }
    const brief = JSON.parse(cleanText) as CreativeBrief;
    if (!brief.coverCopy?.mainHeadline || !brief.coverCopy?.subtitles || !Array.isArray(brief.coverCopy.subtitles)) {
      throw new Error("Invalid brief structure");
    }
    
    // Normalize sublines length
    if (brief.coverCopy.subtitles.length < magazine.sublineCount.min) {
      const needed = magazine.sublineCount.min - brief.coverCopy.subtitles.length;
      const extras = magazine.referenceSublines
        .filter(s => !brief.coverCopy.subtitles.find(sub => sub.text === s))
        .sort(() => 0.5 - Math.random())
        .slice(0, needed)
        .map(s => ({ text: s, typographyWeight: "regular" }));
      brief.coverCopy.subtitles.push(...extras);
    }
    if (brief.coverCopy.subtitles.length > magazine.sublineCount.max) {
      brief.coverCopy.subtitles = brief.coverCopy.subtitles.slice(0, magazine.sublineCount.max);
    }
    
    return brief;
  } catch (e) {
    console.error("Phase 1 JSON parse error:", e, "Raw:", text);
    throw new Error("Failed to parse creative brief");
  }
}
