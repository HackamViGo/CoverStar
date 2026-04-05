import { z } from "zod";

const envSchema = z.object({
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is strictly required"),
  GOOGLE_AI_KEY: z.string().optional(),
});

// Since Next.js bundles in both environments, we rely on the server environment.
const parsed = envSchema.safeParse({
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  GOOGLE_AI_KEY: process.env.GOOGLE_AI_KEY,
});

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(parsed.error.format(), null, 2)
  );
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
