import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { buildImagePrompt } from '@/lib/prompt-builder';
import { MAGAZINES } from '@/lib/magazines';
import { GoogleGenAI } from '@google/genai';

const imageSchema = z.object({
  magazineId: z.string().min(1),
  gender: z.enum(['male', 'female']),
  userName: z.string().optional(),
  brief: z.any(),
  imageBase64: z
    .string()
    .min(1, 'Image is required')
    .max(10 * 1024 * 1024, 'Image too large — max 10MB') 
    .refine((s) => /^[A-Za-z0-9+/]+=*$/.test(s), 'Invalid base64 format'),
});

export async function POST(req: Request): Promise<Response> {
  // 1. Authorization Check
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

  // 3. Payload Size Check (Pre-Parsing)
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 11 * 1024 * 1024) {
    return new Response(JSON.stringify({ error: 'Payload too large' }), { status: 413, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
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
    const genAI = new GoogleGenAI({ apiKey });
    
    const encoder = new TextEncoder();
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 55000);

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          try {
            controller.enqueue(
              encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
            );
          } catch { /* ignore */ }
        };

        try {
          sendEvent('status', { message: 'Rendering your cover...' });

          // Progress mock
          let progress = 0;
          const progressInterval = setInterval(() => {
            progress += 15;
            if (progress < 95) sendEvent('progress', { percent: progress });
          }, 1500);

          // We use the models.generateContent from @google/genai
          const result = await genAI.models.generateContent({
            model: 'gemini-2.0-flash-lite',
            contents: [
              {
                parts: [
                  { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
                  { text: prompt },
                ],
              },
            ],
            // @ts-ignore
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
        'Connection': 'keep-alive',
      },
    });
  } catch (err: any) {
    console.error('API Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
