"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Star, Zap, Trophy, TrendingUp } from "lucide-react";

interface AdScreenProps {
  onComplete: () => void;
  isReady: boolean;
}

export default function AdScreen({ onComplete, isReady }: AdScreenProps) {
  const [timeLeft, setTimeLeft] = useState(10);
  const [currentAd, setCurrentAd] = useState(0);
  const [canFinish, setCanFinish] = useState(false);

  const ads = [
    {
      title: "Elite Membership",
      description: "Join the most exclusive circle of AI creators.",
      icon: <Star className="w-12 h-12 text-gold" />,
      bg: "from-gold/20 to-obsidian"
    },
    {
      title: "Masterpiece Studio",
      description: "Transform your essence into high-fashion art instantly.",
      icon: <Zap className="w-12 h-12 text-gold" />,
      bg: "from-gold/20 to-obsidian"
    },
    {
      title: "Global Prestige",
      description: "Your vision, curated for the world's finest galleries.",
      icon: <Trophy className="w-12 h-12 text-gold" />,
      bg: "from-gold/20 to-obsidian"
    },
    {
      title: "Avant-Garde Trends",
      description: "Define the future of digital elegance.",
      icon: <TrendingUp className="w-12 h-12 text-gold" />,
      bg: "from-gold/20 to-obsidian"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanFinish(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const adTimer = setInterval(() => {
      setCurrentAd(prev => (prev + 1) % ads.length);
    }, 3500);

    return () => {
      clearInterval(timer);
      clearInterval(adTimer);
    };
  }, []);

  useEffect(() => {
    if (canFinish && isReady) {
      onComplete();
    }
  }, [canFinish, isReady, onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center overflow-hidden"
    >
      {/* Background Glow */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentAd}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className={`absolute inset-0 bg-gradient-to-b ${ads[currentAd].bg} opacity-50`}
        />
      </AnimatePresence>

      {/* Desktop Shimmer Overlay */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.05),transparent_70%)]" />
        <motion.div 
          animate={{ 
            x: ["-100%", "100%"],
            opacity: [0, 0.3, 0]
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/10 to-transparent skew-x-12"
        />
      </div>

      <div className="relative z-10 space-y-8 lg:space-y-12 max-w-sm lg:max-w-2xl w-full">
        <div className="flex justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentAd}
              initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 1.5, opacity: 0, rotate: 10 }}
              className="p-6 lg:p-10 bg-gold/5 rounded-3xl border border-gold/20 backdrop-blur-xl shadow-2xl shadow-gold/10"
            >
              {/* Icon sizing */}
              <div className="w-12 h-12 lg:w-[120px] lg:h-[120px] flex items-center justify-center [&>svg]:w-full [&>svg]:h-full">
                {ads[currentAd].icon}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="space-y-4 lg:space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentAd}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="space-y-2 lg:space-y-4"
            >
              <h2 className="text-3xl lg:text-[3rem] font-serif font-bold tracking-tighter italic text-gold-gradient uppercase leading-tight">
                {ads[currentAd].title}
              </h2>
              <p className="text-gold/40 text-sm lg:text-[1.3rem] leading-relaxed font-medium max-w-md mx-auto">
                {ads[currentAd].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="pt-12 lg:pt-16 space-y-4 lg:space-y-6 max-w-md lg:max-w-[600px] mx-auto w-full">
          <div className="relative h-1 lg:h-1.5 bg-gold/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 10, ease: "linear" }}
              className="absolute inset-y-0 left-0 bg-gold-gradient"
            />
          </div>
          <div className="flex items-center justify-between text-[10px] lg:text-[1rem] uppercase tracking-widest lg:tracking-[4px] text-gold/30 font-bold">
            <span>Crafting Excellence</span>
            <span className="text-obsidian bg-gold px-2 lg:px-4 py-1 lg:py-2 rounded font-black lg:text-[1.5rem]">
              {timeLeft}s
            </span>
          </div>
        </div>
      </div>

      <div className="absolute top-6 right-6 z-20">
        <AnimatePresence>
          {timeLeft <= 7 && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setCanFinish(true)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 transition-colors"
            >
              Skip Ad
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center space-x-2 text-zinc-600">
        <Sparkles className="w-3 h-3" />
        <span className="text-[8px] uppercase tracking-[0.3em]">CoverStar Premium Experience</span>
      </div>
    </motion.div>
  );
}
