import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  collectCoverageFrom: [
    // ✅ ВКЛЮЧЕНИ
    'app/api/generate/**/*.{ts,tsx}',   // само generate, БЕЗ auth!
    'app/gallery/page.tsx',
    'app/login/page.tsx',
    'lib/**/*.{ts,tsx}',
    'components/SettingsScreen.tsx',

    // ❌ ИЗКЛЮЧЕНИ
    '!app/api/auth/**',                 // nextauth + register → 0%
    '!app/layout.tsx',
    '!app/page.tsx',
    '!app/error.tsx',
    '!app/loading.tsx',
    '!app/not-found.tsx',
    '!app/forbidden.tsx',
    '!app/unauthorized.tsx',
    '!app/register/**',
    '!app/result/**',
    '!components/AdScreen.tsx',
    '!components/DustAnimation.tsx',
    '!components/MagazineTitle.tsx',
    '!components/providers.tsx',
    '!components/ui/**',
    '!lib/env.ts',
    '!lib/image-utils.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],

  coverageThreshold: {
    global: {
      statements: 80,
      branches: 60,
      lines: 80,
      functions: 35,
    },
    // Строги прагове само за критичните файлове
    './lib/rate-limit.ts': {
      statements: 100,
      branches: 100,
      lines: 100,
      functions: 100,
    },
    './app/api/generate/image/route.ts': {
      statements: 90,
      branches: 75,
      lines: 90,
      functions: 100,
    },
    './app/api/generate/brief/route.ts': {
      statements: 90,
      branches: 85,
      lines: 90,
      functions: 100,
    },
  },
  
  testMatch: ['<rootDir>/__tests__/**/*.{test,spec}.{ts,tsx}'],
};

export default createJestConfig(config);
