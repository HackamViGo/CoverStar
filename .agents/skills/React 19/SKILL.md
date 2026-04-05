# React 19 — Modern Patterns & Hooks

## New Hooks

### `use` — Async Data Handling
Replaces Suspense + data fetching patterns.

```tsx
'use client';
import { use } from 'react';

function CoverGallery() {
  const covers = use(fetchCovers()); // Suspends until promise resolves
  return <div>{covers.map(c => <Card key={c.id} {...c} />)}</div>;
}
```

**When to use**: Client Components that need async data.

### `useActionState` — Form State Management
Replaces `useState` + `onSubmit` pattern.

```tsx
'use client';
import { useActionState } from 'react';

function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <form action={formAction}>
      <input name="email" />
      <button disabled={isPending}>
        {isPending ? 'Logging in...' : 'Login'}
      </button>
      {state?.error && <p>{state.error}</p>}
    </form>
  );
}

async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email');
  // ... authenticate
  return { success: true };
}
```

### `useOptimistic` — Instant UI Updates
Update UI immediately while waiting for server confirmation.

```tsx
'use client';
import { useOptimistic } from 'react';

function CoverList({ covers }) {
  const [optimisticCovers, addOptimisticCover] = useOptimistic(
    covers,
    (state, newCover) => [...state, newCover]
  );

  async function handleGenerate() {
    const tempCover = { id: 'temp', title: 'Generating...' };
    addOptimisticCover(tempCover); // Instant UI update
    
    const realCover = await generateCover(); // Server call
    // State auto-updates when server responds
  }

  return (
    <div>
      {optimisticCovers.map(cover => <Card key={cover.id} {...cover} />)}
      <button onClick={handleGenerate}>Generate</button>
    </div>
  );
}
```

## Actions

### Server Actions
```tsx
// app/actions.ts
'use server';

export async function generateCover(formData: FormData) {
  const magazine = formData.get('magazine');
  const result = await callGeminiAPI(magazine);
  return result;
}
```

```tsx
// components/GenerateForm.tsx
'use client';
import { generateCover } from '@/app/actions';

export function GenerateForm() {
  return (
    <form action={generateCover}>
      <input name="magazine" />
      <button type="submit">Generate</button>
    </form>
  );
}
```

### Client Actions
```tsx
'use client';

async function handleSubmit(formData: FormData) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    body: JSON.stringify({
      magazine: formData.get('magazine'),
    }),
  });
  // ... handle response
}

export function Form() {
  return <form action={handleSubmit}>...</form>;
}
```

## Component Patterns

### NO More `React.FC`
```tsx
// ❌ Old (React 18)
const Button: React.FC<{ label: string }> = ({ label }) => {
  return <button>{label}</button>;
};

// ✅ New (React 19)
interface ButtonProps {
  label: string;
}

function Button({ label }: ButtonProps) {
  return <button>{label}</button>;
}
```

### Ref as Prop (No forwardRef Needed)
```tsx
// ❌ React 18
import { forwardRef } from 'react';

const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  return <input ref={ref} {...props} />;
});

// ✅ React 19
interface InputProps {
  ref?: React.Ref<HTMLInputElement>;
}

function Input({ ref, ...props }: InputProps) {
  return <input ref={ref} {...props} />;
}
```

## Context API Improvements

### Using `use` with Context
```tsx
'use client';
import { use } from 'react';
import { ThemeContext } from './ThemeProvider';

function ThemedButton() {
  const theme = use(ThemeContext); // Simpler than useContext
  return <button style={{ color: theme.color }}>Click</button>;
}
```

## Concurrent Features (Stable in React 19)

### Suspense for Data Fetching
```tsx
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <CoverGallery /> {/* Uses `use(promise)` */}
    </Suspense>
  );
}
```

### Transitions (Smooth UI Updates)
```tsx
'use client';
import { useTransition } from 'react';

function SearchCovers() {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState('');

  function handleSearch(e) {
    const value = e.target.value;
    startTransition(() => {
      setQuery(value); // Mark as low-priority update
    });
  }

  return (
    <div>
      <input onChange={handleSearch} />
      {isPending && <Spinner />}
      <Results query={query} />
    </div>
  );
}
```

## Error Handling

### Error Boundaries (Still Class Components)
```tsx
'use client';
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Error caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
```

Usage:
```tsx
<ErrorBoundary fallback={<ErrorMessage />}>
  <CoverGenerator />
</ErrorBoundary>
```

## Performance Optimizations

### Automatic Memoization (React Compiler)
**Note**: React Compiler is experimental. Once stable, it auto-memoizes components.

For now, use manual optimization:

```tsx
import { memo, useMemo, useCallback } from 'react';

const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  const processed = useMemo(() => processData(data), [data]);
  const handleClick = useCallback(() => {
    console.log('Clicked');
  }, []);
  
  return <div onClick={handleClick}>{processed}</div>;
});
```

### Avoid These Common Mistakes
❌ Using `useEffect` for data fetching (use `use` hook or Server Components)
❌ Creating new objects/arrays in render (causes re-renders)
```tsx
// ❌ Bad
<Component config={{ theme: 'dark' }} />

// ✅ Good
const config = { theme: 'dark' }; // Outside component
<Component config={config} />
```
