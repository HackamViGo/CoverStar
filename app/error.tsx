'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center space-y-6">
      <div className="w-20 h-20 bg-ruby/10 rounded-full flex items-center justify-center">
        <AlertCircle className="w-10 h-10 text-ruby" />
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-serif font-bold italic text-gold-gradient">Something went wrong</h2>
        <p className="text-gold/40 text-sm uppercase tracking-widest max-w-md mx-auto">
          Luxury requires precision. An unexpected error occurred in the studio.
        </p>
      </div>
      <Button
        onClick={() => reset()}
        variant="luxury"
        className="h-12 px-8 flex items-center space-x-2"
      >
        <RefreshCcw className="w-4 h-4" />
        <span>Try Again</span>
      </Button>
    </div>
  );
}
