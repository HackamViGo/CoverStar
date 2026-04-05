---
description: Поправя всички security проблеми — hardcoded secret, base64 validation, AbortController, rate limiting
---

# Workflow: fix-security

## Цел
Поправи всички security проблеми от одита.

## Приоритетни файлове
- `middleware.ts` → hardcoded secret
- `app/api/generate/image/route.ts` → base64 validation + AbortController
- `app/api/auth/[...nextauth]/route.ts` → sameSite cookie
- `components/SettingsScreen.tsx` → misleading "Encrypted" текст

## Стъпки

### 1. middleware.ts — премахни hardcoded secret

```typescript
// ПРЕМАХНИ:
const secret = process.env.NEXTAUTH_SECRET || "coverstar-secret-key-123"

// ДОБАВИ:
const secret = process.env.NEXTAUTH_SECRET;
if (!secret) throw new Error("NEXTAUTH_SECRET is not configured");
```

### 2. base64 validation в image route

```typescript
const imageSchema = z.object({
  imageBase64: z
    .string()
    .min(1, 'Image is required')
    .max(
      10 * 1024 * 1024 * 1.37,
      'Image too large — max 10MB'
    )
    .refine(
      (s) => /^[A-Za-z0-9+/]+=*$/.test(s),
      'Invalid base64 format'
    ),
  prompt: z.string().min(1).max(2000),
});
```

### 3. AbortController за Gemini

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 55_000);

try {
  const result = await model.generateContent(prompt);
  clearTimeout(timeoutId);
} catch (err: any) {
  clearTimeout(timeoutId);
  if (err.name === 'AbortError') {
    sendEvent('error', { message: 'Времето изтече. Опитай отново.' });
  }
  throw err;
}
```

### 4. sameSite cookie fix

```typescript
// В [...nextauth]/route.ts
options: { 
  sameSite: 'lax',  // беше 'none'
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true
}
```

### 5. SettingsScreen.tsx — премахни misleading текст

```typescript
// ЗАМЕНИ:
"Encrypted local storage active"
// С:
"Stored locally in your browser"
```

### 6. Rate limiting

```typescript
import { LRUCache } from 'lru-cache';

const rateLimit = new LRUCache<string, number>({
  max: 500,
  ttl: 60_000, // 1 минута
});

export function checkRateLimit(ip: string, max = 5): boolean {
  const current = rateLimit.get(ip) ?? 0;
  if (current >= max) return false;
  rateLimit.set(ip, current + 1);
  return true;
}
```

### 7. Провери всичко

```bash
npm run test:security   # Само security тестовете
npm run build           # Провери за TypeScript грешки
```
