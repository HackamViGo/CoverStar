export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <div className="relative">
        {/* Animated Glow */}
        <div className="absolute inset-[-20px] bg-gold/20 blur-3xl rounded-full animate-pulse opacity-50" />
        
        {/* Spinning Ring */}
        <div className="w-16 h-16 border-4 border-gold/10 border-t-gold rounded-full animate-spin shadow-[0_0_15px_rgba(212,175,55,0.2)]" />
        
        {/* Centered Icon or Pulse */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-gold rounded-full animate-ping" />
        </div>
      </div>
      
      <p className="mt-8 text-gold/60 text-xs font-serif italic tracking-[0.3em] uppercase animate-pulse">
        Initializing Studio...
      </p>
    </div>
  );
}
