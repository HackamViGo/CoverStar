---
description: Поправя фиктивния authentication — bcrypt, реална валидация, премахване на hardcoded secrets
---

# Workflow: fix-auth

## Цел
Поправи фиктивния authentication в CoverStar.

## Стъпки

### 1. Инсталирай зависимостите

```bash
npm install bcryptjs @types/bcryptjs
# или използвай JSON файл за users (без Prisma)
```

### 2. Създай lib/auth.ts

```typescript
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  name: string;
  email: string;
  hashedPassword: string;
}

// За прост старт — JSON файл като "база данни"
// В продукция замени с Prisma + реална DB
const USERS_FILE = 'data/users.json';

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const { readFileSync } = await import('fs');
    const users: User[] = JSON.parse(readFileSync(USERS_FILE, 'utf-8'));
    return users.find(u => u.email === email) ?? null;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
```

### 3. Поправи app/api/auth/[...nextauth]/route.ts

- Замени фиктивния `authorize()` с реална валидация
- Премахни hardcoded fallback secret
- Смени `sameSite` от `'none'` на `'lax'`

```typescript
async authorize(credentials) {
  if (!credentials?.email || !credentials?.password) return null;
  const user = await getUserByEmail(credentials.email);
  if (!user) return null;
  const isValid = await verifyPassword(credentials.password, user.hashedPassword);
  if (!isValid) return null;
  return { id: user.id, email: user.email, name: user.name };
}
```

### 4. Създай app/api/auth/register/route.ts

- Хеширай паролата с bcrypt преди запис
- Валидирай email формат и password strength с Zod
- Върни `409` ако email вече съществува

### 5. Поправи middleware.ts

```typescript
// ПРЕМАХНИ:
const secret = process.env.NEXTAUTH_SECRET || 'coverstar-secret-key-123';

// ДОБАВИ:
const secret = process.env.NEXTAUTH_SECRET;
if (!secret) throw new Error('NEXTAUTH_SECRET is not configured');
```

### 6. Провери

```bash
npm run test:security   # Само security тестовете
npm run test:api        # API тестовете
```

- Провери че невалидни credentials връщат грешка
- Провери че липсващ NEXTAUTH_SECRET хвърля Error
