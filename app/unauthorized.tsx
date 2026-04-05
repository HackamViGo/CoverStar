'use client';

import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UnauthorizedError() {
  const router = useRouter();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center space-y-6">
      <div className="w-20 h-20 bg-ruby/10 rounded-full flex items-center justify-center">
        <ShieldAlert className="w-10 h-10 text-ruby" />
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-serif font-bold italic text-gold-gradient">401 Unauthorized</h2>
        <p className="text-gold/40 text-sm uppercase tracking-widest max-w-md mx-auto">
          You lack the proper credentials to access this area of the studio.
        </p>
      </div>
      <Button
        onClick={() => router.push('/login')}
        variant="luxury"
        className="h-12 px-8 flex items-center space-x-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Login</span>
      </Button>
    </div>
  );
}
