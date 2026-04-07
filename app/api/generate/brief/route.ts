import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { generateCreativeBrief } from '@/lib/creative-director';
import { MAGAZINES } from '@/lib/magazines';

const briefSchema = z.object({
  magazineId: z.string().min(1),
  gender: z.enum(['male', 'female', 'unisex']).optional().default('female'),
  topic: z.string().min(3).max(500).optional().default("Fashion Cover"),
});

export async function POST(req: Request): Promise<Response> {
  // 1. Authorization
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const apiKey = authHeader.slice(7).trim();
  if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
    if (!checkRateLimit(ip, 12)) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Bad Request', details: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const parsed = briefSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Bad Request', details: parsed.error }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const { magazineId, gender, topic } = parsed.data;
    const magazine = MAGAZINES.find((m) => m.id === magazineId);
    if (!magazine) return new Response(JSON.stringify({ error: 'Magazine not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

    // AI Generation via shared library
    const brief = await generateCreativeBrief(apiKey, magazine, gender as any, topic);

    return new Response(JSON.stringify(brief), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Brief API Error:', error.message);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
