import { Magazine } from "./magazines";
import { CreativeBrief } from "./creative-director";
import { getRandom, ANGLE_POOL, SEASON_POOL } from "./generation-pools";

export function buildImagePrompt(
  magazine: Magazine,
  brief: CreativeBrief,
  gender: "male" | "female",
  userName?: string
): string {
  const angle = getRandom(ANGLE_POOL);
  const season = getRandom(SEASON_POOL);
  const sublinesText = brief.sublines.map((s, i) => `Line ${i + 1}: "${s}"`).join(". ");

  let specialInstructions = "";
  
  if (magazine.id === "time") {
    specialInstructions += `\nCRITICAL RULE FOR TIME: The entire cover MUST be framed by a thick RED BORDER (#B91C1C) like a window. "TIME" appears in WHITE inside the top border.`;
  }
  if (magazine.id === "vogue") {
    specialInstructions += `\nCRITICAL RULE FOR VOGUE: ABSOLUTELY NO TEXT OVER THE FACE OR EYES. The subject's face MUST remain 100% clean and unobstructed. Push all typography to the extreme outer margins. Use massive negative space.`;
  }
  if (magazine.id === "cosmopolitan") {
    specialInstructions += `\nCRITICAL RULE FOR COSMO: Dense text layout. Scatter text dynamically around the subject using bright pinks and yellows. Numbers must be massive.`;
  }

  return `Create a photorealistic, publication-ready magazine cover for ${magazine.name}.
${userName ? `The cover star's name is ${userName}. You may incorporate it into one of the headlines if appropriate for the magazine's style (e.g., "${userName}: THE NEW FACE OF FASHION").` : ""}

[CRITICAL FACE IDENTITY LOCK]
- You are performing an editorial styling shoot AROUND the provided reference face.
- The face in the reference image MUST be preserved with 100% pixel-perfect fidelity.
- DO NOT alter the core facial identity, bone structure, eye shape, nose shape, lip shape, or ethnicity.
- DO NOT apply heavy "AI beautification", plastic skin smoothing, or digital makeup that changes how the person looks.
- The generated image must be recognizable as the EXACT SAME PERSON. Change the clothes, pose, lighting, and background, but LEAVE THE FACIAL LIKENESS EXACTLY AS IT IS.

STYLING & SCENE:
- Cover Star: A ${gender} matching the reference identity.
- Clothing: Seamlessly dress the subject in ${brief.clothing}. Fits naturally. Season: ${season}.
- Pose & Expression: ${brief.pose}. ${brief.expression}. Camera angle: ${angle}.

LAYOUT & GRID RULES:
- LOGO: ${magazine.logoPlacement}
- TEXT DENSITY: ${magazine.textDensity}.
- MAIN HEADLINE: Render exactly: "${brief.headline}"
- COVER LINES: Render exactly: ${sublinesText}
- SPATIAL GRID: ${magazine.spatialGrid}

VISUAL DNA & MATERIALITY:
- Color Palette: ${magazine.colorInstructions}
- Lighting: Apply ${magazine.lightingDna}. (Match shadows on the new body to the light source on the original face).
- Material: ${magazine.materialFinish}. Shot on Hasselblad H6D-100c, 8K resolution.

TYPOGRAPHY ENGINE:
${magazine.typographyLayout}. Text must look naturally PRINTED and interact with paper texture.
${specialInstructions}

STRICT NEGATIVE CONSTRAINTS:
- NO face swapping or identity morphing.
- NO waxy, glossy, or CGI-looking skin. Keep natural pores visible.
- NO deformed or misspelled text.
- NO text covering the subject's face or eyes.`;
}
