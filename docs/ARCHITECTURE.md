# ARCHITECTURE.md - CoverStar Architecture Overview

CoverStar follows a modern Next.js 15 App Router architecture with a focus on client-side AI generation and smooth animations.

## Architectural Overview

The application is structured as a Single Page Application (SPA) for the generation flow, with additional routes for authentication and a gallery.

```text
[Client-Side]
  ├── React (Next.js App Router)
  ├── Zustand (State Management)
  ├── Motion (Animations)
  └── Google Generative AI SDK (Client-side API calls)
[Server-Side]
  ├── NextAuth.js (Session Management)
  └── Next.js API Routes (Auth logic)
[Storage]
  ├── IndexedDB (Local Gallery Storage)
  └── Browser Cookies (Auth Session)
```

## Routing

| Route | File Path | Description |
|-------|-----------|-------------|
| `/` | `app/page.tsx` | The main generation flow (Upload -> Generate -> Result). |
| `/login` | `app/login/page.tsx` | User login page using NextAuth.js. |
| `/register` | `app/register/page.tsx` | User registration page. |
| `/gallery` | `app/gallery/page.tsx` | Displays all generated covers saved in IndexedDB. |
| `/api/auth/[...nextauth]` | `app/api/auth/[...nextauth]/route.ts` | NextAuth.js configuration and API endpoints. |

## Middleware

The `middleware.ts` file protects the `/` (Home) and `/gallery` routes. It checks for a valid NextAuth session and redirects unauthenticated users to the `/login` page.

## Authentication

Authentication is handled by **NextAuth.js** using a `CredentialsProvider`. It manages user sessions via secure cookies (`SameSite: 'none'`, `Secure: true`) to ensure compatibility within iframes.

## State Management

The global state is managed using **Zustand** in `lib/store.ts`.

| State Field | Description |
|-------------|-------------|
| `user` | Current authenticated user information. |
| `setUser` | Action to update user state. |
| `logout` | Action to clear user state. |

## Components

### Feature Components (`components/`)

| Component | Description | Props |
|-----------|-------------|-------|
| `AdScreen.tsx` | Displays high-fashion ads during AI generation. | `onComplete: () => void`, `isReady: boolean` |
| `DustAnimation.tsx` | Cinematic particle reveal animation after generation. | `onComplete: () => void` |
| `SettingsScreen.tsx` | User settings and profile management overlay. | `onClose: () => void` |
| `providers.tsx` | Wraps the app with `SessionProvider` and `Toaster`. | `children: React.ReactNode` |

### UI Components (`components/ui/`)

| Component | API (Props) | Description |
|-----------|-------------|-------------|
| `button.tsx` | `variant`, `size`, `asChild` | Standard button with multiple variants (default, destructive, outline, etc.). |
| `card.tsx` | `Card`, `CardHeader`, `CardTitle`, `CardContent` | Flexible card layout components. |
| `input.tsx` | Standard HTML input props | Styled text input field. |
| `label.tsx` | Standard HTML label props | Styled label for form elements. |

## Library Modules (`lib/`)

- **`generation-pools.ts`**: Contains arrays of prompts and styles used to randomize the AI generation process.
- **`magazines.ts`**: Defines the data structure and content for the magazine templates.
- **`store.ts`**: The Zustand store for global application state.
- **`utils.ts`**: Contains the `cn()` utility for merging Tailwind CSS classes.

## Styling

The application uses **Tailwind CSS 4** with utility classes. Global styles are defined in `app/globals.css`. Animations are powered by `motion/react`, providing smooth transitions between generation steps.

## Layout and Metadata

- **`layout.tsx`**: Defines the root HTML structure, imports fonts (Inter), and wraps the application with necessary providers.
- **`metadata.json`**: Contains the application's name, description, and required frame permissions (camera, microphone, geolocation).

---
*For data models and API details, see [API_AND_DATA.md](./API_AND_DATA.md).*
