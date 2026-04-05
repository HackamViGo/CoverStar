---
trigger: always_on
---

# CoverStar — Antigravity Global Rules

## 🔐 SECURITY (ЗАДЪЛЖИТЕЛНИ)
- НИКОГА не използвай hardcoded secrets, fallback strings за JWT или API keys
- ВИНАГИ хеширай пароли с bcrypt с minimum 12 rounds
- НИКОГА не съхранявай чувствителни данни в localStorage като plaintext
- ВИНАГИ валидирай размера на base64 payload преди обработка
- НИКОГА не добавяй console.log с токени, пароли или потребителски данни
- sameSite cookie трябва да е 'lax' освен ако изрично не е нужно 'none'

## 🏗️ АРХИТЕКТУРА
- Всички AI SDK imports САМО в `/app/api/` routes — никога в client компоненти
- Zustand store само в 'use client' компоненти
- idb-keyval само в dynamic import() вътре в useEffect
- SessionProvider винаги с ssr: false
- Използвай router.push() вместо window.location.href

## 🧪 ТЕСТОВЕ
- Всяка нова функция трябва да има unit test
- API routes трябва да имат integration test
- Security-критични функции задължително имат negative tests (неверни входни данни)
- Тестовете трябва да покриват happy path + edge cases + error states

## 📝 КОД СТИЛ
- TypeScript strict mode ВИНАГИ
- Zod validation за ВСИЧКИ API inputs
- Всички async функции с try/catch и typed errors
- AbortController за всички дълги мрежови заявки (>10s)
- useEffect ВИНАГИ с cleanup функция

## 📱 PWA & SEO
- OG image URL винаги absolute (използвай process.env.NEXTAUTH_URL)
- PWA icons САМО локални файлове в /public/icons/
- sitemap.ts и robots.ts задължителни преди deploy
- next/image вместо <img> навсякъде