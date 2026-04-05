---
trigger: always_on
---

# CoverSar Project Rules — AI-Powered Magazine Cover Generator

## Project Context
- **Tech Stack**: Next.js 15, React 19, TypeScript, Tailwind CSS 4, Zustand, Motion
- **Auth**: next-auth v4.24.13 (NextAuth.js) with Credentials provider
- **AI**: Google Generative AI SDK (Gemini 1.5 Flash)
- **Storage**: IndexedDB (idb-keyval) for client-side gallery
- **Deployment**: Vercel-ready PWA

## Architecture Patterns

### File Structure
```
app/               → Next.js App Router (React Server Components by default)
components/        → Client Components ('use client') + UI library
lib/               → Business logic, utilities, stores (isomorphic)
public/            → Static assets
```

### Component Rules
- **Server Components**: Default in `app/`. NO hooks, NO browser APIs
- **Client Components**: Mark with 'use client'. Use for interactivity, state, effects
- **Shared Logic**: Extract to `lib/` — must work on server AND client

### Data Flow
```
User Input → Zustand Store → API Route (server) → Google Gemini → Response → UI
                           ↘ (or) Client-side call (with user API key)
```

## Code Standards

### TypeScript
- **Strict mode enabled** — no implicit `any`
- Use `interface` for public APIs, `type` for unions/intersections
- File naming: `kebab-case.tsx` for components, `camelCase.ts` for utilities

### React 19 Specifics
- Prefer `use` hook for promises (replaces Suspense + data fetching patterns)
- Use `useActionState` for form handling (replaces useState + onSubmit)
- Use `useOptimistic` for instant UI updates before server confirms
- NO `React.FC` — use plain function declarations
- Actions can be async Server Actions or client-side functions

### Next.js 15 Specifics
- **App Router only** — no Pages Router
- Use `generateMetadata` for dynamic meta tags
- Use `forbidden()` and `unauthorized()` in Server Components for auth errors
- Middleware for auth protection (check session before route access)
- API Routes in `app/api/*/route.ts` — export GET, POST, etc.

### Styling
- **Tailwind CSS 4** — utility-first
- Use `cn()` from `lib/utils.ts` to merge classes conditionally
- Component variants via `class-variance-authority` (cva)
- NO inline styles unless absolutely necessary
- Animations via `motion/react` (NOT framer-motion)

### State Management
- **Zustand** for global state (auth, settings, generation progress)
- **No Redux** — Zustand is simpler and sufficient
- Persist auth-related state ONLY if necessary (security risk with API keys)
- Use selectors to prevent unnecessary re-renders:
  ```tsx
  const apiKey = useStore(state => state.apiKey); // ✅ Good
  const store = useStore(); // ❌ Re-renders on ANY change
  ```

## Security Rules 🔴 CRITICAL

### API Keys
- **User-provided keys**: Sent via `Authorization: Bearer <key>` header
- **NEVER log, cache, or store user API keys server-side**
- **NEVER expose keys in response bodies or error messages**
- Server-side fallback: `process.env.GOOGLE_AI_KEY` (optional)

### Authentication
- NextAuth session cookies: `SameSite: 'lax'`, `Secure: true` in production
- **NO hardcoded secrets** — `NEXTAUTH_SECRET` must be in `.env`
- bcryptjs rounds: **minimum 12** for password hashing
- Validate all API route inputs with **Zod schemas** — return 400 for invalid data

### Validation Pattern
```typescript
import { z } from 'zod';

const schema = z.object({
  magazineId: z.string().min(1).max(50),
  gender: z.enum(['male', 'female', 'neutral']),
});

const result = schema.safeParse(await req.json());
if (!result.success) {
  return new Response(JSON.stringify({ error: result.error }), { status: 400 });
}
```

## AI Generation Rules

### Google Gemini API
- **Model**: `gemini-2.5-flash-lite` (fast, cost-effective)
- **Two-phase generation**:
  1. **Creative Brief** (text) — analyzes uploaded photo + magazine DNA
  2. **Image Synthesis** (gemini-2.5-flash-image) — generates cover
- **Streaming**: Use `ReadableStream` + SSE for long-running image gen

### Prompt Engineering
- Use structured prompts from `lib/prompt-builder.ts`
- Include: magazine style, user attributes, lighting, composition rules
- Randomize backgrounds/lighting from `lib/generation-pools.ts`

## Browser APIs

### IndexedDB (idb-keyval)
- **Client-side only** — wrap ALL calls:
  ```typescript
  if (typeof window !== 'undefined') {
    const { get, set } = await import('idb-keyval');
    // ... use get/set
  }
  ```
- Store generated covers in gallery
- Key format: `cover-${timestamp}`

## Performance

### Optimization Checklist
- Use `next/image` for ALL images (automatic optimization)
- Lazy load heavy components:
  ```tsx
  const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
    loading: () => <Skeleton />,
  });
  ```
- Memoize expensive computations with `useMemo`
- Debounce user input (search, settings changes)

## Error Handling

### Global Boundaries
- `app/error.tsx` — catches unhandled errors in UI
- `app/unauthorized.tsx` — handles 401 from middleware
- `app/forbidden.tsx` — handles 403 (role-based access)
- `app/not-found.tsx` — custom 404 page

### API Routes
```typescript
try {
  // ... logic
} catch (error) {
  console.error('API Error:', error.message); // ✅ Log message only
  return new Response(
    JSON.stringify({ error: 'Internal server error' }), 
    { status: 500 }
  );
}
```

## Testing & Verification

### Before Commit
```bash
npx tsc --noEmit       # TypeScript check
npm run build          # Production build test
npm audit              # Security vulnerabilities
```

### Manual Testing
- Test image generation flow (upload → brief → cover)
- Verify API key is NOT visible in DevTools Network tab
- Test error states (invalid input, missing API key, network failure)
- Test PWA offline functionality

## When to Use Web Search
- Checking latest package versions before update
- Verifying Next.js 15/16 or React 19 API changes
- Finding Gemini API model names or parameter updates
- Investigating specific error messages from npm/build

## Common Pitfalls to Avoid
❌ Using `'use client'` everywhere (makes RSC useless)
❌ Fetching data in Client Components (use Server Components + pass as props)
❌ Importing server-only code in client bundles
❌ Mutating Zustand state directly (always use `set()`)
❌ Forgetting `await` with Server Actions
❌ Using `useEffect` for data fetching (use `use` hook or Server Components)
❌ Hardcoding API keys in code