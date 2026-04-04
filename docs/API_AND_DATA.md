# API_AND_DATA.md - CoverStar API and Data Models

CoverStar uses a combination of client-side AI generation and server-side authentication.

## API Endpoints

### Authentication (NextAuth.js)

| Method | URL | Request Body | Response | Status Codes |
|--------|-----|--------------|----------|--------------|
| `POST` | `/api/auth/signin/credentials` | `{ username, password }` | Session Cookie | `200`, `401` |
| `GET` | `/api/auth/session` | N/A | User Session Object | `200` |
| `POST` | `/api/auth/signout` | N/A | Clear Cookie | `200` |

### AI Generation (Google Gemini)

AI generation is performed directly from the client using the `@google/genai` SDK.

| Method | SDK Call | Parameters | Response |
|--------|----------|------------|----------|
| `POST` | `ai.models.generateContent` | `{ model: 'gemini-2.5-flash-image', contents: { parts: [image, prompt] }, config: { imageConfig: { aspectRatio: "3:4" } } }` | `GenerateContentResponse` (base64 image) |

## Data Models / Types

### User

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}
```

### Magazine Cover (Gallery Item)

```typescript
interface MagazineCover {
  id: string;
  imageUrl: string; // Base64 or Blob URL
  title: string;
  createdAt: number;
}
```

### Generation Pool Item

```typescript
interface GenerationPoolItem {
  id: string;
  prompt: string;
  style: string;
  name: string;
}
```

## Authentication Flow

1. **Register/Login:** User enters credentials on `/register` or `/login`.
2. **Session Creation:** NextAuth.js validates and creates a session cookie.
3. **Protected Routes:** Middleware (`middleware.ts`) checks for the session on `/` and `/gallery`.
4. **Session Access:** Client components use `useSession()` to access user data.
5. **Logout:** User triggers sign-out, clearing the session cookie.

## Generation Pools (`lib/generation-pools.ts`)

The `generation-pools.ts` file contains arrays of prompts and styles used to randomize the AI's output. These are categorized by fashion themes (e.g., "Vogue", "Harper's Bazaar").

## Magazines Data (`lib/magazines.ts`)

The `magazines.ts` file defines the structure of the magazine templates, including their titles, descriptions, and visual styles.

## Store Schema (`lib/store.ts`)

The Zustand store maintains the following state:

```typescript
interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}
```

## Middleware Rules

| Route | Rule | Action |
|-------|------|--------|
| `/` | `isAuthenticated == false` | Redirect to `/login` |
| `/gallery` | `isAuthenticated == false` | Redirect to `/login` |
| `/login` | `isAuthenticated == true` | Redirect to `/` |
| `/register` | `isAuthenticated == true` | Redirect to `/` |

## Error Handling

- **API Errors:** Handled using `try...catch` blocks. Errors are logged to the console and displayed to the user via `sonner` toasts.
- **AI Generation Errors:** If the Gemini API fails, a descriptive error message is shown, and the user is prompted to try again.
- **Auth Errors:** NextAuth.js handles common auth errors (e.g., invalid credentials) and provides feedback on the login page.

## External Services

- **Google Gemini API:** Used for hyper-realistic image generation.
- **Picsum Photos:** Used for placeholder images in the gallery and ads.

---
*For project setup, see [README.md](./README.md). For architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md).*
