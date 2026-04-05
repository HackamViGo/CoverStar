import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
      <div className="text-center space-y-6">
        <p className="text-8xl font-serif font-bold text-[#D4AF37]/40">404</p>
        <h1 className="text-3xl font-serif font-bold italic text-[#D4AF37]">
          Page Not Found
        </h1>
        <p className="text-sm text-white/40 uppercase tracking-widest">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-3 border border-[#D4AF37]/30 text-[#D4AF37] text-xs uppercase tracking-widest hover:bg-[#D4AF37]/10 transition-colors"
        >
          Return to Studio
        </Link>
      </div>
    </div>
  );
}
