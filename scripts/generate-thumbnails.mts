import { GoogleGenAI } from "@google/genai";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { MAGAZINES } from "../lib/magazines";
import { generateCreativeBrief, generateFallbackBrief } from "../lib/creative-director";
import { buildImagePrompt } from "../lib/prompt-builder";

// Public domain AI-generated face - no copyright issues
// Source: This Person Does Not Exist (thispersondoesnotexist.com equivalent)
// We use a stable royalty-free image URL for consistency
const SEED_FACES = {
  female: process.env.SEED_FACE_FEMALE_URL || "https://picsum.photos/seed/female_face/320/320",
  male:   process.env.SEED_FACE_MALE_URL   || "https://picsum.photos/seed/male_face/320/320",
};

async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch seed face: ${url}`);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = response.headers.get("content-type") || "image/jpeg";
  return { data: buffer.toString("base64"), mimeType };
}

async function generateThumbnail(
  apiKey: string,
  magazineId: string,
  targetGender?: "male" | "female",
  delayMs = 0
): Promise<void> {
  // Rate limit safety: stagger requests
  if (delayMs > 0) {
    await new Promise((r) => setTimeout(r, delayMs));
  }

  const magazine = MAGAZINES.find((m) => m.id === magazineId);
  if (!magazine) {
    console.error(`[SKIP] Magazine not found: ${magazineId}`);
    return;
  }

  const fileName = targetGender ? `${magazineId}-${targetGender}.jpg` : `${magazineId}.jpg`;
  const outputPath = join(process.cwd(), "public", "thumbnails", fileName);
  
  if (existsSync(outputPath)) {
    console.log(`[SKIP] Already exists: ${fileName}`);
    return;
  }

  const gender = targetGender || (magazine.gender === "male" ? "male" : "female");
  console.log(`[START] ${magazine.name} (${gender})...`);

  try {
    // Fetch seed face
    const seedFace = await fetchImageAsBase64(SEED_FACES[gender]);

    // Phase 1: Creative Brief
    let brief;
    try {
      brief = await generateCreativeBrief(apiKey, magazine, gender);
    } catch {
      console.warn(`[Phase 1 Fallback] ${magazine.name}`);
      brief = generateFallbackBrief(magazine);
    }

    // Phase 2: Image Synthesis
    const masterPrompt = buildImagePrompt(magazine, brief, gender);
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { data: seedFace.data, mimeType: seedFace.mimeType } },
            { text: masterPrompt },
          ],
        },
      ],
      config: {
        imageConfig: {
          aspectRatio: "3:4",
        }
      },
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData
    );

    if (!imagePart?.inlineData?.data) {
      const reason = response.candidates?.[0]?.finishReason;
      throw new Error(`No image returned. Reason: ${reason || "unknown"}`);
    }

    const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");
    writeFileSync(outputPath, imageBuffer);
    console.log(`[DONE] Saved: /public/thumbnails/${fileName}`);

  } catch (error: any) {
    console.error(`[ERROR] ${magazine.name}: ${error.message}`);
  }
}

async function main() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY environment variable is required.");
  }

  // Create output directory
  const thumbnailsDir = join(process.cwd(), "public", "thumbnails");
  mkdirSync(thumbnailsDir, { recursive: true });

  const tasks: { id: string; gender?: "male" | "female" }[] = [];
  for (const mag of MAGAZINES) {
    if (mag.gender === "unisex") {
      tasks.push({ id: mag.id, gender: "male" });
      tasks.push({ id: mag.id, gender: "female" });
    }
    // Always generate the base one too (for "ALL" filter or default)
    tasks.push({ id: mag.id });
  }

  console.log(`\n🎨 Generating thumbnails for ${tasks.length} magazine variants...\n`);

  // Process sequentially with 3s delay to respect rate limits
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    await generateThumbnail(apiKey, task.id, task.gender, i === 0 ? 0 : 3000);
  }

  console.log("\n✅ All thumbnails generated! Run your app to see the results.");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
