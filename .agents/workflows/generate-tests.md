---
description: Генерира тестове за целия проект — unit, integration, negative tests, минимум 80% coverage
---

# Workflow: generate-tests

## Цел
Генерирай тестове за целия CoverStar проект.

## Команда
Когато се тригерира, агентът трябва да:
1. Анализира всеки файл в `/app/api/`, `/components/`, `/lib/`
2. Генерира unit тест за всяка exported функция
3. Генерира integration тест за всеки API route
4. Генерира negative tests за всички валидации
5. Стартира `npm run test:all` и поправя failing тестове

## Покритие
- Минимум **80% code coverage**
- **100%** покритие на security-критични функции
- Всички edge cases от одита

## Структура на тестовете

```
__tests__/
├── api/              → API route тестове
├── components/       → React component тестове  
├── security/         → Auth, validation, middleware тестове
├── pwa/              → Manifest, service worker тестове
└── seo/              → Metadata, sitemap, robots тестове
```

## Актуална jest.config.ts (✅ Поправена)

```typescript
import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],  // ✅ Не setupFilesAfterFramework!
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    '!app/api/auth/**',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: ['<rootDir>/__tests__/**/*.{test,spec}.{ts,tsx}'],  // ✅ Не testPathPattern!
};

export default createJestConfig(config);
```

## Команди за стартиране

```bash
npm run test              # Всички тестове
npm run test:watch        # Watch режим (за development)
npm run test:coverage     # Coverage report
npm run test:security     # Само __tests__/security/
npm run test:api          # Само __tests__/api/
npm run test:components   # Само __tests__/components/
npm run test:pwa          # Само __tests__/pwa/
npm run test:seo          # Само __tests__/seo/
npm run test:all          # Всичко + verbose report
npm run test:ci           # За GitHub Actions
```
