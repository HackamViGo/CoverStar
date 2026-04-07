import { Magazine } from "./magazines";
import { CreativeBrief } from "./creative-director";

export function buildImagePrompt(
  magazine: Magazine,
  brief: CreativeBrief,
  gender: "male" | "female" | "unisex",
  userName?: string
): string {
  // Mapping strictRule to the new dynamic strict properties we'll add
  const strictRule = (magazine as any).strictRule || "";
  const forbiddenElements = (magazine as any).forbiddenElements || "";

  return `[SYSTEM: STRICT FACIAL CONSISTENCY]
Enable strict facial consistency mode. Prioritize the facial features from the provided reference image for all subsequent generations. Maintain the subject's identity accurately while only adapting the pose, lighting, and background. Do not alter the core facial structure.

[ROLE]
You are an award-winning fashion photographer and graphic designer creating the final cover for ${magazine.name}.

[PHOTOGRAPHY & STYLING]
Subject: A ${gender === "unisex" ? "person" : gender === "male" ? "man" : "woman"}.
Clothing: ${brief.photographyDirection.clothingAndStyling}
Pose & Expression: ${brief.photographyDirection.poseAndExpression}
Lighting: ${brief.photographyDirection.lightingStyle}
Background: ${brief.photographyDirection.backgroundAndSet}
Color Palette: ${brief.editorialConcept.colorPalette}

[TYPOGRAPHY & LAYOUT - CRITICAL]
Generate the following text natively into the image:
Main Headline: "${brief.coverCopy.mainHeadline}" (Font style: ${magazine.fontStyle})
Subtitles: ${brief.coverCopy.subtitles.map(s => `"${s.text}"`).join(" | ")}
Layout Rules: ${brief.coverCopy.layoutInstructions}. 
${strictRule ? `MAGAZINE STRICT RULE: ${strictRule}` : ""}
${forbiddenElements ? `FORBIDDEN: ${forbiddenElements}` : ""}

[AESTHETIC QUALITY]
Ensure 4k resolution, hyper-realistic skin texture, and professional magazine cover grading.`;
}
