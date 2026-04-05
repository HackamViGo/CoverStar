---
description: Пълен post-deployment одит на CoverStar — Security, Functionality, Performance, PWA, SEO
---

# Workflow: audit

## Цел
Прави пълен post-deployment одит на CoverStar проекта
и генерира доклад с приоритизирани проблеми.

## Тригер
/audit

## Стъпки

### ФАЗА 1 — СИГУРНОСТ
Провери следните файлове:

#### 1.1 middleware.ts
- [ ] Има ли hardcoded fallback secret? (|| "some-string")
- [ ] Има ли if (!secret) throw Error?
- [ ] Защитени ли са всички non-public routes?

#### 1.2 app/api/auth/[...nextauth]/route.ts
- [ ] Извиква ли се bcrypt.compare()?
- [ ] sameSite: 'lax' (не 'none')?
- [ ] httpOnly: true?
- [ ] Валидира ли се email + password преди authorize()?

#### 1.3 app/api/generate/image/route.ts
- [ ] Има ли imageBase64 size validation?
- [ ] Има ли AbortController с timeout?
- [ ] Има ли rate limiting?

#### 1.4 Глобални проверки
- [ ] Има ли console.log с token/password/key навсякъде?
- [ ] Има ли hardcoded secrets в кода?
- [ ] localStorage съдържа ли plaintext пароли?

---

### ФАЗА 2 — ФУНКЦИОНАЛНОСТ

#### 2.1 Задължителни файлове
- [ ] app/not-found.tsx
- [ ] app/sitemap.ts
- [ ] app/robots.ts
- [ ] app/error.tsx
- [ ] app/loading.tsx
- [ ] app/unauthorized.tsx

#### 2.2 Navigation
- [ ] router.push() навсякъде (не window.location.href)?
- [ ] Middleware redirect работи ли?

#### 2.3 Streaming
- [ ] AbortController присъства ли?
- [ ] SSE headers: text/event-stream?
- [ ] Client consume-ва ли stream правилно?

---

### ФАЗА 3 — PERFORMANCE

#### 3.1 Bundle
- [ ] AI SDK само в /app/api/ routes?
- [ ] idb-keyval само в dynamic import()?
- [ ] Колко Google Fonts се зареждат? (>5 = предупреждение)

#### 3.2 Memory Leaks
Провери всеки useEffect:
- [ ] setInterval → clearInterval?
- [ ] setTimeout → clearTimeout?
- [ ] addEventListener → removeEventListener?
- [ ] requestAnimationFrame → cancelAnimationFrame?

---

### ФАЗА 4 — PWA

- [ ] next.config.ts съдържа ли withPWA()?
- [ ] manifest.json icons са ли локални (/icons/...)?
- [ ] Има ли icon-192x192.png в /public/icons/?
- [ ] Има ли icon-512x512.png в /public/icons/?
- [ ] Service Worker регистриран ли е?

---

### ФАЗА 5 — SEO

- [ ] OG image URL е ли absolute (process.env.NEXTAUTH_URL)?
- [ ] twitter:image е ли absolute URL?
- [ ] sitemap.xml достъпен ли е на /sitemap.xml?
- [ ] robots.txt достъпен ли е на /robots.txt?
- [ ] /api/ е ли в disallow на robots?

---

### ИЗХОД — Генерирай таблица:

След проверката генерирай:

| Категория | Score | Критични | Важни | Препоръки |
|-----------|-------|----------|-------|-----------|
| SECURITY | X/10 | N | N | N |
| FUNCTIONALITY | X/10 | N | N | N |
| PERFORMANCE | X/10 | N | N | N |
| PWA | X/10 | N | N | N |
| SEO | X/10 | N | N | N |
| **ОБЩО** | **X/50** | | | |

После листни всички намерени проблеми по приоритет:
🔴 КРИТИЧНИ → 🟠 ВАЖНИ → 🟡 ПРЕПОРЪКИ

За всеки проблем:
- Файл + ред
- Текущо поведение
- Очаквано поведение
- Workflow за поправка (/fix-auth, /fix-security и т.н.)
