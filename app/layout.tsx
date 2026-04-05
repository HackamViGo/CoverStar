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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Bebas+Neue&family=Libre+Bodoni:wght@400;700&family=Dancing+Script:wght@700&family=Josefin+Sans:wght@700&family=Cormorant+Garamond:wght@300;600&family=Oswald:wght@700;900&family=Montserrat:wght@900&family=UnifrakturMaguntia&family=Libre+Baskerville:wght@700&family=Arvo:wght@700&family=Black+Han+Sans&family=Russo+One&family=Teko:wght@700&display=swap"
          rel="stylesheet"
        />
      </head>
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
