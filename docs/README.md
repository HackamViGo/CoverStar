# CoverStar - AI Magazine Cover Generator

CoverStar is a high-fashion AI application that allows users to transform their photos into hyper-realistic magazine covers using Google's Gemini AI.

## Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations:** [Motion](https://motion.dev/) (formerly Framer Motion)
- **AI Engine:** [Google Generative AI SDK](https://ai.google.dev/gemini-api/docs/sdk) (Gemini 2.5 Flash Image)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)
- **Storage:** [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (via `idb-keyval`)
- **Icons:** [Lucide React](https://lucide.dev/)

## Prerequisites

- **Node.js:** v18.17.0 or higher
- **npm:** v9.x or higher
- **Google Gemini API Key:** Obtain from [Google AI Studio](https://aistudio.google.com/)

## Installation and Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd coverstar
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add the following variables based on `.env.example`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   APP_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Public API key for Google Gemini AI. |
| `APP_URL` | The base URL of the application. |
| `NEXTAUTH_SECRET` | Secret key used by NextAuth.js for session encryption. |
| `NEXTAUTH_URL` | The canonical URL of the application for NextAuth.js. |

## Project Structure

```text
/
├── app/                # Next.js App Router (Pages & API)
│   ├── api/            # Backend API routes
│   ├── gallery/        # User's generated covers gallery
│   ├── login/          # Authentication pages
│   ├── register/       # User registration
│   └── page.tsx        # Main application entry (Generation flow)
├── components/         # Reusable React components
│   ├── ui/             # Shared UI primitives (Shadcn-like)
│   └── ...             # Feature-specific components
├── lib/                # Utility functions, stores, and data
├── public/             # Static assets and manifest
├── metadata.json       # App metadata and permissions
├── middleware.ts       # Next.js Middleware (Auth protection)
└── next.config.ts      # Next.js configuration
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Starts the development server. |
| `npm run build` | Builds the application for production. |
| `npm run start` | Starts the production server. |
| `npm run lint` | Runs ESLint to check for code quality issues. |

## PWA Support

The application includes a `manifest.json` in the `public/` directory, enabling it to be installed as a Progressive Web App (PWA) on supported devices. It uses `@ducanh2912/next-pwa` for service worker management.

## Deployment

The application is optimized for deployment on **Vercel** or any platform supporting Next.js. Ensure all environment variables are correctly configured in the production environment.

---
*For more details, see [ARCHITECTURE.md](./ARCHITECTURE.md) and [API_AND_DATA.md](./API_AND_DATA.md).*
