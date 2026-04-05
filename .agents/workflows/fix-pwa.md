---
description: Конфигурира PWA правилно — next.config.ts, manifest.json, локални icons
---

# Workflow: fix-pwa

## Цел
Конфигурирай PWA правилно.

## Стъпки

### 1. next.config.ts

```typescript
import withPWA from "@ducanh2912/next-pwa";

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [],
  },
};

export default withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
```

### 2. Създай локални icons

```bash
# Създай директория
mkdir -p public/icons

# Генерирай icons от оригинала (трябва ImageMagick)
convert public/logo.png -resize 192x192 public/icons/icon-192x192.png
convert public/logo.png -resize 512x512 public/icons/icon-512x512.png
convert public/logo.png -resize 180x180 public/icons/apple-touch-icon.png
```

### 3. Поправи manifest.json

```json
{
  "name": "CoverStar",
  "short_name": "CoverStar",
  "description": "AI Magazine Cover Generator",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#D4AF37",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### 4. Провери

```bash
npm run test:pwa        # PWA тестовете
npm run build
# Отвори Chrome DevTools → Application → Service Workers
```
