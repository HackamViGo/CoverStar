# Next.js 15 — App Router & React Server Components

## Core Concepts

### App Router (app/)
- **File-based routing**: `app/page.tsx` = `/`, `app/about/page.tsx` = `/about`
- **Layouts**: `app/layout.tsx` wraps all pages (persistent UI)
- **Templates**: `app/template.tsx` re-mounts on navigation (for animations)

### Server vs Client Components

| Feature | Server Component | Client Component |
|---------|-----------------|------------------|
| Default | ✅ Yes | No (must add 'use client') |
| Hooks (useState, useEffect) | ❌ | ✅ |
| Browser APIs (window, localStorage) | ❌ | ✅ |
| Direct database access | ✅ | ❌ |
| Async functions | ✅ (can be async) | ❌ (use useEffect) |
| Bundle size | 0 KB to client | Included in bundle |

**Rule**: Start with Server Components, add 'use client' ONLY when needed.

### Data Fetching Patterns

#### Server Component (Preferred)
```tsx
// app/gallery/page.tsx
export default async function GalleryPage() {
  const covers = await fetchCovers(); // Direct async/await
  return <div>{covers.map(...)}</div>;
}
```

#### Client Component (When Interactive)
```tsx
'use client';
import { use } from 'react'; // React 19 hook

export default function InteractiveGallery() {
  const coversPromise = fetchCovers();
  const covers = use(coversPromise); // Suspends until resolved
  return <div>{covers.map(...)}</div>;
}
```

## API Routes

### File Convention
```
app/api/generate/route.ts  → /api/generate
```

### Export Named HTTP Methods
```typescript
export async function GET(req: Request) {
  return Response.json({ message: 'Hello' });
}

export async function POST(req: Request) {
  const body = await req.json();
  // ... process
  return Response.json({ success: true });
}
```

### Dynamic Routes
```
app/api/covers/[id]/route.ts
```
```typescript
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const coverId = params.id;
  // ...
}
```

### Streaming Responses (SSE)
```typescript
export async function POST(req: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue('data: Starting...\n\n');
      // ... AI generation
      controller.enqueue('data: Complete\n\n');
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

## Metadata API

### Static Metadata
```typescript
// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CoverStar',
  description: 'AI-powered magazine covers',
  openGraph: {
    title: 'CoverStar',
    description: 'Create magazine covers with AI',
    images: ['/og-image.jpg'],
  },
};
```

### Dynamic Metadata
```typescript
// app/result/[id]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const cover = await getCover(params.id);
  return {
    title: `${cover.magazine} Cover`,
    openGraph: {
      images: [cover.imageUrl],
    },
  };
}
```

## Error Handling

### Error Boundaries
```tsx
// app/error.tsx
'use client'; // MUST be client component

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### Not Found
```tsx
// app/not-found.tsx
export default function NotFound() {
  return <h2>404 - Page not found</h2>;
}
```

### Unauthorized/Forbidden (Next.js 15.1+)
```tsx
// app/unauthorized.tsx
export default function Unauthorized() {
  return <h2>401 - Please log in</h2>;
}
```

```tsx
// In a Server Component or API route
import { unauthorized } from 'next/navigation';

if (!session) {
  unauthorized(); // Renders app/unauthorized.tsx
}
```

## Middleware

### Auth Protection
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('next-auth.session-token');
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/gallery'], // Protect these routes
};
```

## Image Optimization

```tsx
import Image from 'next/image';

<Image
  src="/cover.jpg"
  alt="Magazine cover"
  width={800}
  height={1000}
  priority // Above fold images
  placeholder="blur" // With blurDataURL
/>
```

## Environment Variables

### Client-side (Public)
```
NEXT_PUBLIC_SITE_URL=https://coverstar.app
```
Access: `process.env.NEXT_PUBLIC_SITE_URL` (works in client components)

### Server-side (Private)
```
GOOGLE_AI_KEY=abc123
NEXTAUTH_SECRET=xyz789
```
Access: `process.env.GOOGLE_AI_KEY` (ONLY in Server Components/API routes)

## Common Patterns for CoverStar

### Protected Page
```tsx
// app/page.tsx (Server Component)
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await getServerSession();
  if (!session) redirect('/login');
  
  return <GenerationFlow />;
}
```

### Client Interactivity in Server Page
```tsx
// app/page.tsx (Server Component)
import { ClientForm } from '@/components/ClientForm';

export default function Home() {
  return (
    <div>
      <h1>Server-rendered title</h1>
      <ClientForm /> {/* This handles user interactions */}
    </div>
  );
}
```
