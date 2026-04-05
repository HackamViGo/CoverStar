---
description: Поправя SEO проблемите — absolute OG image URL, sitemap.ts, robots.ts, not-found.tsx
---

# Workflow: fix-seo

## Цел
Поправи SEO проблемите — OG image URL, sitemap, robots.

## Стъпки

### 1. app/layout.tsx — absolute OG image URL

```typescript
const BASE_URL = process.env.NEXTAUTH_URL ?? 'https://coverstar.pro';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  openGraph: {
    images: [
      {
        url: `${BASE_URL}/thumbnails/vogue.jpg`,
        width: 1200,
        height: 630,
        alt: 'CoverStar — AI Magazine Cover Generator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [`${BASE_URL}/thumbnails/vogue.jpg`],
  },
};
```

### 2. Създай app/sitemap.ts

```typescript
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXTAUTH_URL ?? 'https://coverstar.pro';
  const now = new Date();

  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${base}/gallery`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${base}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${base}/register`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}
```

### 3. Създай app/robots.ts

```typescript
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXTAUTH_URL ?? 'https://coverstar.pro';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/unauthorized', '/forbidden'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
```

### 4. Създай app/not-found.tsx

```tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-gold">
      <h1 className="text-8xl font-serif font-bold italic text-yellow-500">
        404
      </h1>
      <p className="text-yellow-500/40 text-xs uppercase tracking-widest mt-4">
        Page not found
      </p>
      <Link
        href="/"
        className="mt-8 text-yellow-500 border border-yellow-500/30 px-6 py-2 text-sm uppercase tracking-widest hover:bg-yellow-500/10 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
```

### 5. Провери

```bash
npm run test:seo        # Само SEO тестовете
npm run build           # Провери sitemap.xml и robots.txt
```
