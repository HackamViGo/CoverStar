# Authentication — NextAuth.js v4

## Setup

### Installation
```bash
npm install next-auth@4.24.13
```

### Configuration
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // 1. Fetch user from database
        const user = await getUserByEmail(credentials.email);
        
        // 2. Verify password
        if (!user || !await bcrypt.compare(credentials.password, user.hashedPassword)) {
          return null; // Login failed
        }
        
        // 3. Return user object
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax', // or 'none' if in iframe
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET, // NEVER hardcode
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
});

export { handler as GET, handler as POST };
```

## Usage Patterns

### Server-Side Session Check
```typescript
// app/page.tsx (Server Component)
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/login');
  }
  
  return <div>Welcome, {session.user.name}</div>;
}
```

### Client-Side Session Check
```tsx
'use client';
import { useSession } from 'next-auth/react';

export function UserProfile() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') return <Spinner />;
  if (status === 'unauthenticated') return <LoginPrompt />;
  
  return <div>Hello, {session.user.email}</div>;
}
```

### Middleware Protection
```typescript
// middleware.ts
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/gallery'],
};
```

## SessionProvider Setup

```tsx
// components/providers.tsx
'use client';
import { SessionProvider } from 'next-auth/react';

export function Providers({ children, session }) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
```

```tsx
// app/layout.tsx
import { Providers } from '@/components/providers';
import { getServerSession } from 'next-auth';

export default async function RootLayout({ children }) {
  const session = await getServerSession();
  
  return (
    <html>
      <body>
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

**CRITICAL**: `SessionProvider` MUST be in a Client Component with `'use client'`.

## Sign In/Out

### Sign In Form
```tsx
'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

export function LoginForm() {
  const [error, setError] = useState('');
  
  async function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const result = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false,
    });
    
    if (result?.error) {
      setError('Invalid credentials');
    } else {
      window.location.href = '/'; // Redirect on success
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Login</button>
      {error && <p>{error}</p>}
    </form>
  );
}
```

### Sign Out
```tsx
'use client';
import { signOut } from 'next-auth/react';

export function LogoutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: '/login' })}>
      Sign Out
    </button>
  );
}
```

## Password Hashing (bcryptjs)

```typescript
import bcrypt from 'bcryptjs';

// Registration
const hashedPassword = await bcrypt.hash(plainPassword, 12); // 12 rounds minimum

// Login (in authorize function)
const isValid = await bcrypt.compare(plainPassword, user.hashedPassword);
```

**NEVER** hash passwords in client components — always in API routes.

## Environment Variables

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here
```

Generate secret:
```bash
openssl rand -base64 32
```

## Common Issues

### React 19 SessionProvider Error
If `SessionProvider` throws hook errors:

```tsx
// components/providers.tsx
'use client';
import dynamic from 'next/dynamic';

const SessionProvider = dynamic(
  () => import('next-auth/react').then(mod => mod.SessionProvider),
  { ssr: false }
);

export function Providers({ children, session }) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
```

### Cookies in iframes
If your app runs in an iframe, use:
```typescript
cookies: {
  sessionToken: {
    options: {
      sameSite: 'none', // Required for cross-site iframes
      secure: true,     // HTTPS required with 'none'
    },
  },
},
```
