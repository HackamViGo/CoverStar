# Security Best Practices — CoverStar

## API Key Handling 🔴 CRITICAL

### User-Provided Keys
```typescript
// ✅ Correct — API route
export async function POST(req: Request) {
  const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'API key required' }),
      { status: 401 }
    );
  }
  
  // Use key WITHOUT logging
  const genAI = new GoogleGenerativeAI(apiKey);
  // ... generation logic
  
  // ❌ NEVER do this:
  // console.log('Using key:', apiKey);
  // cache.set('user-key', apiKey);
}
```

### Server-Side Fallback
```typescript
const apiKey = 
  req.headers.get('Authorization')?.replace('Bearer ', '') ||
  process.env.GOOGLE_AI_KEY;

if (!apiKey) {
  return new Response('Unauthorized', { status: 401 });
}
```

### Client-Side (Sending Key)
```tsx
'use client';

async function generateCover() {
  const apiKey = useStore.getState().apiKey;
  
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`, // ✅ Header only
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ /* ... */ }),
  });
}
```

## Input Validation

### Zod Schemas
```typescript
import { z } from 'zod';

const GenerateSchema = z.object({
  magazineId: z.string().min(1).max(50),
  gender: z.enum(['male', 'female', 'neutral']),
  imageBase64: z.string().min(1).max(10_000_000), // ~7MB limit
});

export async function POST(req: Request) {
  const body = await req.json();
  const result = GenerateSchema.safeParse(body);
  
  if (!result.success) {
    return new Response(
      JSON.stringify({ 
        error: 'Invalid input',
        details: result.error.format(),
      }),
      { status: 400 }
    );
  }
  
  const { magazineId, gender, imageBase64 } = result.data;
  // ... safe to use
}
```

### File Upload Limits
```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function validateImage(base64: string): boolean {
  const sizeInBytes = (base64.length * 3) / 4;
  if (sizeInBytes > MAX_FILE_SIZE) {
    throw new Error('Image too large');
  }
  
  // Validate base64 format
  const regex = /^data:image\/(png|jpg|jpeg|webp);base64,/;
  if (!regex.test(base64)) {
    throw new Error('Invalid image format');
  }
  
  return true;
}
```

## Authentication Security

### Password Hashing
```typescript
import bcrypt from 'bcryptjs';

// Registration (API route)
const hashedPassword = await bcrypt.hash(password, 12); // Min 12 rounds

// Never hash in client components
// ❌ WRONG:
// 'use client';
// const hash = await bcrypt.hash(password, 12); // This exposes bcrypt to client bundle!
```

### Session Cookies
```typescript
// app/api/auth/[...nextauth]/route.ts
cookies: {
  sessionToken: {
    name: 'next-auth.session-token',
    options: {
      httpOnly: true,       // ✅ Prevents XSS access
      sameSite: 'lax',      // ✅ CSRF protection (or 'none' for iframes)
      secure: process.env.NODE_ENV === 'production', // ✅ HTTPS only in prod
      path: '/',
    },
  },
},
```

### Secret Management
```typescript
// lib/env.ts — validate at startup
const requiredEnvVars = ['NEXTAUTH_SECRET', 'NEXTAUTH_URL'];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`❌ Missing required environment variable: ${key}`);
  }
});

// ✅ Generate strong secret:
// openssl rand -base64 32
```

## Rate Limiting (Optional but Recommended)

```typescript
// lib/rate-limit.ts
import { LRUCache } from 'lru-cache';

const rateLimitCache = new LRUCache({
  max: 500,
  ttl: 60000, // 1 minute
});

export function rateLimit(identifier: string, limit = 10): boolean {
  const count = (rateLimitCache.get(identifier) as number) || 0;
  
  if (count >= limit) {
    return false; // Rate limit exceeded
  }
  
  rateLimitCache.set(identifier, count + 1);
  return true;
}
```

```typescript
// app/api/generate/route.ts
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  
  if (!rateLimit(ip, 5)) { // 5 requests per minute
    return new Response('Too many requests', { status: 429 });
  }
  
  // ... proceed
}
```

## XSS Prevention

### Sanitize User Input (if displaying)
```tsx
import DOMPurify from 'isomorphic-dompurify';

function UserComment({ text }: { text: string }) {
  const clean = DOMPurify.sanitize(text);
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}
```

**Better**: Avoid `dangerouslySetInnerHTML` entirely — use plain text.

### Content Security Policy
```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; img-src 'self' data: blob:;",
          },
        ],
      },
    ];
  },
};
```

## HTTPS & Secure Headers

```typescript
// middleware.ts
export function middleware(req: NextRequest) {
  const response = NextResponse.next();
  
  // Enforce HTTPS in production
  if (process.env.NODE_ENV === 'production' && !req.url.startsWith('https')) {
    return NextResponse.redirect(`https://${req.headers.get('host')}${req.nextUrl.pathname}`);
  }
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}
```

## IndexedDB Security

```typescript
// ❌ DON'T store sensitive data
await set('user-api-key', apiKey); // Visible in DevTools → Application → IndexedDB

// ✅ DO store non-sensitive data
await set('generated-covers', covers);
await set('user-preferences', { theme: 'dark' });
```

## Audit Checklist

Before deployment:
```bash
npm audit                # Check for vulnerabilities
npm audit fix            # Auto-fix if possible
npm outdated             # Check for outdated packages
```

Manual checks:
- [ ] API keys NEVER logged
- [ ] NEXTAUTH_SECRET in .env (not hardcoded)
- [ ] bcrypt rounds >= 12
- [ ] All user inputs validated with Zod
- [ ] Rate limiting on public endpoints
- [ ] HTTPS enforced in production
- [ ] SessionProvider is 'use client'
- [ ] No sensitive data in localStorage/IndexedDB
