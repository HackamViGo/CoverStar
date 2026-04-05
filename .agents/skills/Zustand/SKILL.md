# Zustand — State Management

## Basic Store

```typescript
// lib/store.ts
import { create } from 'zustand';

interface AppState {
  apiKey: string;
  currentStep: number;
  profile: {
    gender: 'male' | 'female' | 'neutral';
  };
  
  // Actions
  setApiKey: (key: string) => void;
  setCurrentStep: (step: number) => void;
  setProfile: (profile: Partial<AppState['profile']>) => void;
  reset: () => void;
}

export const useStore = create<AppState>((set) => ({
  apiKey: '',
  currentStep: 1,
  profile: {
    gender: 'neutral',
  },
  
  setApiKey: (key) => set({ apiKey: key }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setProfile: (profile) => set((state) => ({
    profile: { ...state.profile, ...profile }
  })),
  reset: () => set({
    apiKey: '',
    currentStep: 1,
    profile: { gender: 'neutral' },
  }),
}));
```

## Usage in Components

### Basic Usage
```tsx
'use client';
import { useStore } from '@/lib/store';

export function SettingsPanel() {
  const apiKey = useStore((state) => state.apiKey);
  const setApiKey = useStore((state) => state.setApiKey);
  
  return (
    <input
      value={apiKey}
      onChange={(e) => setApiKey(e.target.value)}
    />
  );
}
```

### Selecting Multiple Values
```tsx
const { currentStep, setCurrentStep } = useStore((state) => ({
  currentStep: state.currentStep,
  setCurrentStep: state.setCurrentStep,
}));
```

### Avoid Full Store Access (Performance)
```tsx
// ❌ Bad — re-renders on ANY state change
const store = useStore();

// ✅ Good — re-renders only when apiKey changes
const apiKey = useStore((state) => state.apiKey);
```

## Persistence (localStorage)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      apiKey: '',
      setApiKey: (key) => set({ apiKey: key }),
    }),
    {
      name: 'coverstar-storage', // localStorage key
      partialize: (state) => ({ 
        profile: state.profile, // Only persist profile
        // Exclude apiKey for security
      }),
    }
  )
);
```

**SECURITY WARNING**: Persisting API keys in localStorage is risky. Consider session-only storage.

## Async Actions

```typescript
interface AppState {
  covers: Cover[];
  isLoading: boolean;
  fetchCovers: () => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  covers: [],
  isLoading: false,
  
  fetchCovers: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/covers');
      const covers = await response.json();
      set({ covers, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to fetch covers:', error);
    }
  },
}));
```

## Middleware

### Immer (Immutable Updates)
```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export const useStore = create<AppState>()(
  immer((set) => ({
    profile: { gender: 'neutral' },
    
    setProfile: (updates) => set((state) => {
      state.profile = { ...state.profile, ...updates }; // Direct mutation (Immer handles it)
    }),
  }))
);
```

### Devtools (Redux DevTools)
```typescript
import { devtools } from 'zustand/middleware';

export const useStore = create<AppState>()(
  devtools(
    (set) => ({ /* ... */ }),
    { name: 'CoverStarStore' }
  )
);
```

## Slices Pattern (Large Stores)

```typescript
// lib/slices/authSlice.ts
export const createAuthSlice = (set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
});

// lib/slices/settingsSlice.ts
export const createSettingsSlice = (set) => ({
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
});

// lib/store.ts
import { create } from 'zustand';
import { createAuthSlice } from './slices/authSlice';
import { createSettingsSlice } from './slices/settingsSlice';

export const useStore = create((set) => ({
  ...createAuthSlice(set),
  ...createSettingsSlice(set),
}));
```

## Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useStore } from './store';

test('updates API key', () => {
  const { result } = renderHook(() => useStore());
  
  act(() => {
    result.current.setApiKey('test-key-123');
  });
  
  expect(result.current.apiKey).toBe('test-key-123');
});
```

## Common Patterns for CoverStar

### Generation Flow State
```typescript
interface GenerationState {
  phase: 'idle' | 'brief' | 'generating' | 'complete' | 'error';
  progress: number;
  result: Cover | null;
  error: string | null;
  
  startGeneration: () => void;
  updateProgress: (progress: number) => void;
  setResult: (cover: Cover) => void;
  setError: (error: string) => void;
  reset: () => void;
}
```
