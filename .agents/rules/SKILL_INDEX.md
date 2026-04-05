# SKILL_INDEX.md — CoverStar Skills Reference

> Пълен индекс на всички налични skills в `.agents/skills/`.
> Всеки skill съдържа `SKILL.md` с детайлни patterns и примери за кода.

---

## 📦 Налични Skills

### 1. 🚀 Next.js 15 — App Router & RSC
**Път:** `.agents/skills/NextJS 15/SKILL.md`

Покрива:
- App Router файлова структура и routing
- Server vs Client Components (разлики, кога да използваш кое)
- Data fetching patterns (Server Components, `use` hook)
- API Routes (`GET`, `POST`, streaming SSE)
- Dynamic routes и параметри
- Metadata API (статична и динамична)
- Error handling (`error.tsx`, `not-found.tsx`, `unauthorized.tsx`)
- Middleware за auth protection
- `next/image` оптимизация
- Environment variables (public vs private)
- Protected pages pattern

---

### 2. 🔐 Next Auth 14 — Authentication
**Път:** `.agents/skills/Next Auth 14/SKILL.md`

Покрива:
- NextAuth.js v4.24.13 setup с Credentials provider
- Server-side session check (`getServerSession`)
- Client-side session check (`useSession`)
- Middleware protection с `getToken`
- `SessionProvider` setup (важно: `'use client'`)
- Sign in / Sign out форми
- Password hashing с bcryptjs (минимум 12 rounds)
- Environment variables (`NEXTAUTH_SECRET`, `NEXTAUTH_URL`)
- Решения за React 19 + SessionProvider compatibility
- Cookie настройки за iframes

---

### 3. ⚛️ React 19 — Modern Patterns
**Път:** `.agents/skills/React 19/SKILL.md`

Покрива:
- Нови hooks: `use`, `useActionState`, `useOptimistic`
- Server Actions и Client Actions
- Премахване на `React.FC` — plain function declarations
- `ref` като prop (без `forwardRef`)
- Context с `use(Context)` вместо `useContext`
- Suspense и Transitions
- Error Boundaries (Class Components)
- Performance: `memo`, `useMemo`, `useCallback`
- Автоматична мемоизация (React Compiler — experimental)
- Честни грешки: `useEffect` за data fetching е ЛОШО

---

### 4. 🛡️ Security — Best Practices
**Път:** `.agents/skills/Security/SKILL.md`

Покрива:
- API Key handling (user-provided + server fallback)
- Input validation с Zod schemas
- File upload limits и base64 validation
- Password hashing (bcryptjs — само в API routes)
- Session cookies настройки (httpOnly, sameSite, secure)
- Secret management и startup validation
- Rate limiting с LRU Cache
- XSS Prevention и Content Security Policy
- HTTPS enforcement и security headers
- IndexedDB — какво да НЕ съхраняваш
- Pre-deployment audit checklist

---

### 5. 🐻 Zustand — State Management
**Път:** `.agents/skills/Zustand/SKILL.md`

Покрива:
- Basic store setup (TypeScript typed)
- Селектори (performance: избягвай `useStore()` без selector)
- Множество стойности с един selector
- Persistence с `zustand/middleware/persist`
- Async actions в store
- Middleware: Immer, Devtools
- Slices pattern за големи stores
- Testing с `renderHook` и `act`
- `GenerationState` pattern за CoverStar flow

---

## 🗂️ Структура на `.agents/`

```
.agents/
├── rules/
│   ├── core-rules.md       ← Глобални security & архитектурни правила
│   ├── rules.md            ← CoverStar проект-специфични правила
│   ├── strict-testing.md   ← TDD & testing изисквания
│   └── SKILL_INDEX.md      ← Този файл
├── skills/
│   ├── NextJS 15/SKILL.md
│   ├── Next Auth 14/SKILL.md
│   ├── React 19/SKILL.md
│   ├── Security/SKILL.md
│   └── Zustand/SKILL.md
└── workflows/              ← Автоматизирани workflows
```

---

## 📋 Rules Overview

| Файл | Съдържание |
|------|-----------|
| `core-rules.md` | Security, архитектура, тестове, код стил, PWA & SEO |
| `rules.md` | Tech stack, component rules, data flow, styling, Gemini AI patterns |
| `strict-testing.md` | TDD подход, Jest unit тестове, Playwright E2E |

---

## 🧪 Test Structure

```
__tests__/
├── api/
│   ├── generate-brief.test.ts
│   ├── generate-image.test.ts
│   └── rate-limit.test.ts
├── components/
│   ├── gallery.test.tsx
│   ├── login.test.tsx
│   └── settings.test.tsx
├── security/
│   ├── auth.test.ts
│   ├── input-validation.test.ts
│   └── middleware.test.ts
├── pwa/
│   └── manifest.test.ts
└── seo/
    └── metadata.test.ts
```

### Test команди

| Команда | Описание |
|---------|----------|
| `npm run test` | Всички тестове |
| `npm run test:watch` | Watch режим |
| `npm run test:coverage` | Coverage report |
| `npm run test:security` | Само `__tests__/security/` |
| `npm run test:api` | Само `__tests__/api/` |
| `npm run test:components` | Само `__tests__/components/` |
| `npm run test:pwa` | Само `__tests__/pwa/` |
| `npm run test:seo` | Само `__tests__/seo/` |
| `npm run test:all` | Coverage + verbose report |
| `npm run test:ci` | За CI/CD pipeline |
