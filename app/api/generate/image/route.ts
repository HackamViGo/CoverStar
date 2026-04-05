import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { buildImagePrompt } from '@/lib/prompt-builder';
import { MAGAZINES } from '@/lib/magazines';

const imageSchema = z.object({
  magazineId: z.string().min(1),
  gender: z.enum(['male', 'female']),
  userName: z.string().optional(),
  brief: z.any(),
  imageBase64: z.string().min(100), // Basic size check
});

// ---------------------------------------------------------------------------
// Google AI Compatibility Wrapper
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-require-imports
const _genai = require('@google/genai') as any;

const GoogleGenerativeAI =
  _genai.GoogleGenerativeAI ||
  (class {
    private key: string;
    constructor(apiKey: string) {
      this.key = apiKey;
    }
    getGenerativeModel({ model }: { model: string }) {
      return {
        generateContent: async (options: any) => {
          const { GoogleGenAI } = _genai;
          const ai = new GoogleGenAI({ apiKey: this.key });
          return await ai.models.generateContent({ model, ...options });
        },
      };
    }
  });

export async function POST(req: Request): Promise<Response> {
  // 1. Authorization Check (MUST BE FIRST)
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const apiKey = authHeader.slice(7).trim();
  if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  // 2. Rate Limit
  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
  if (!checkRateLimit(ip, 10)) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    // 3. JSON Parsing (Robust)
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Bad Request', details: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // 4. Zod Validation
    const parsed = imageSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Bad Request', details: parsed.error }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const { magazineId, brief, gender, userName, imageBase64 } = parsed.data;
    const magazine = MAGAZINES.find((m) => m.id === magazineId);
    if (!magazine) return new Response(JSON.stringify({ error: 'Magazine not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

    const prompt = buildImagePrompt(magazine, brief, gender, userName);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });

    const encoder = new TextEncoder();
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 60000);

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          try {
            controller.enqueue(
              encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
            );
          } catch {
            /* ignore */
          }
        };

        try {
          sendEvent('status', { message: 'Rendering your cover...' });

          // Mock progress updates
          let progress = 0;
          const progressInterval = setInterval(() => {
            progress += 15;
            if (progress < 95) sendEvent('progress', { percent: progress });
          }, 1500);

          const result = await model.generateContent({
            contents: {
              parts: [
                { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
                { text: prompt },
              ],
            },
            config: { imageConfig: { aspectRatio: '3:4' } },
            //@ts-ignore
            signal: abortController.signal
          });

          clearTimeout(timeoutId);
          clearInterval(progressInterval);
          sendEvent('progress', { percent: 100 });

          const candidate = result.candidates?.[0];
          let imageUrl = '';
          if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
              if (part.inlineData) {
                imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                break;
              }
            }
          }

          if (!imageUrl) throw new Error('Generation failed');

          sendEvent('success', { imageUrl });
          controller.close();
        } catch (err: any) {
          sendEvent('error', { message: err.message });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
