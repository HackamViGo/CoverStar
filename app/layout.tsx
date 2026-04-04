import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "CoverStar | The Luxury AI Magazine Studio",
  description: "Become a magazine cover star with AI. Elegant, high-end, and sophisticated.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-[#050505] text-[#F5F5F5] min-h-screen selection:bg-[#D4AF37]/30`}>
        <Providers>
          {children}
        </Providers>
        <Toaster 
          position="top-center" 
          richColors 
          toastOptions={{
            style: {
              background: '#0a0a0a',
              border: '1px solid #D4AF37',
              color: '#F5F5F5',
            }
          }}
        />
      </body>
    </html>
  );
}
