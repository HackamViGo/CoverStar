"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MAGAZINES } from "@/lib/magazines";
import { MagazineTitle } from "@/components/MagazineTitle";

interface DustAnimationProps {
  title: string;
  imageUrl: string;
  onComplete: () => void;
}

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  angle: number;
  friction: number;
  ease: number;

  constructor(width: number, height: number) {
    const side = Math.floor(Math.random() * 4);
    if (side === 0) { this.x = Math.random() * width; this.y = -50; }
    else if (side === 1) { this.x = width + 50; this.y = Math.random() * height; }
    else if (side === 2) { this.x = Math.random() * width; this.y = height + 50; }
    else { this.x = -50; this.y = Math.random() * height; }

    this.vx = (Math.random() - 0.5) * 2;
    this.vy = (Math.random() - 0.5) * 2;
    this.size = Math.random() * 1.5 + 0.5;
    this.alpha = Math.random() * 0.4 + 0.6;
    this.angle = Math.random() * Math.PI * 2;
    this.friction = 0.95 + Math.random() * 0.04;
    this.ease = 0.02 + Math.random() * 0.03;
  }

  update(currentPhase: string, targetX: number, targetY: number) {
    if (currentPhase === "gathering") {
      const dx = targetX - this.x;
      const dy = targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 10) {
        this.vx += dx * this.ease;
        this.vy += dy * this.ease;
        this.vx *= this.friction;
        this.vy *= this.friction;
      } else {
        this.angle += 0.05;
        const swirlX = targetX + Math.cos(this.angle) * 30;
        const swirlY = targetY + Math.sin(this.angle) * 30;
        this.vx += (swirlX - this.x) * 0.1;
        this.vy += (swirlY - this.y) * 0.1;
        this.vx *= 0.8;
        this.vy *= 0.8;
      }
    } else if (currentPhase === "dispersing" || currentPhase === "revealing") {
      const dx = this.x - targetX;
      const dy = this.y - targetY;
      this.vx += dx * 0.01 + (Math.random() - 0.5) * 2;
      this.vy += dy * 0.01 + (Math.random() - 0.5) * 2;
      this.vx *= 0.98;
      this.vy *= 0.98;
      this.alpha -= 0.015;
    }
    this.x += this.vx;
    this.y += this.vy;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    // Use gold color for particles
    ctx.fillStyle = `rgba(212, 175, 55, ${Math.max(0, this.alpha)})`;
    ctx.fill();
    // Add a subtle glow to some particles
    if (this.size > 1.2) {
      ctx.shadowBlur = 5;
      ctx.shadowColor = "rgba(212, 175, 55, 0.5)";
    } else {
      ctx.shadowBlur = 0;
    }
  }
}

export default function DustAnimation({ title, imageUrl, onComplete }: DustAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"gathering" | "formed" | "revealing" | "dispersing">("gathering");

  const particlesRef = useRef<Particle[]>([]);
  const phaseRef = useRef<"gathering" | "formed" | "revealing" | "dispersing">("gathering");

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", updateSize);
    updateSize();

    const width = canvas.width;
    const height = canvas.height;

    const particleCount = 1500; // Increased for more luxury feel
    const targetX = width / 2;
    const targetY = height / 2;

    if (particlesRef.current.length === 0) {
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push(new Particle(width, height));
      }
    }

    let animationFrame: number;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particlesRef.current.forEach(p => {
        p.update(phaseRef.current, targetX, targetY);
        p.draw(ctx);
      });
      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", updateSize);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  useEffect(() => {
    const gatheringTimeout = setTimeout(() => setPhase("formed"), 2500);
    const formedTimeout = setTimeout(() => setPhase("revealing"), 4500);
    const revealingTimeout = setTimeout(() => setPhase("dispersing"), 5500);
    const completeTimeout = setTimeout(() => onComplete(), 6500);

    return () => {
      clearTimeout(gatheringTimeout);
      clearTimeout(formedTimeout);
      clearTimeout(revealingTimeout);
      clearTimeout(completeTimeout);
    };
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-obsidian flex items-center justify-center overflow-hidden"
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
      
      <div className="absolute top-8 right-8 z-20">
        <button
          onClick={onComplete}
          className="px-6 py-2 bg-gold/10 hover:bg-gold/20 backdrop-blur-xl rounded-full text-[10px] font-bold uppercase tracking-[0.3em] border border-gold/20 text-gold transition-all duration-300"
        >
          Skip Intro
        </button>
      </div>

      <AnimatePresence>
        {phase === "formed" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, filter: "blur(20px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.2, filter: "blur(20px)" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative z-20 text-center"
          >
            {(() => {
              const mag = MAGAZINES.find(m => m.name === title || m.id === title);
              if (!mag) return (
                <h2 className="text-4xl lg:text-7xl font-serif font-bold italic tracking-tighter text-gold-gradient drop-shadow-[0_0_40px_rgba(212,175,55,0.4)] uppercase px-4">
                  {title}
                </h2>
              );
              
              if (mag.id === "time") {
                return (
                  <span
                    className="px-8 py-2 bg-red-600 text-white text-4xl lg:text-7xl tracking-widest drop-shadow-[0_0_40px_rgba(212,175,55,0.4)]"
                    style={{ fontFamily: mag.uiFont, fontWeight: mag.uiFontWeight }}
                  >
                    {mag.name}
                  </span>
                );
              }
              
              return (
                <MagazineTitle 
                  magazine={mag} 
                  className="text-4xl lg:text-7xl tracking-tighter text-gold-gradient drop-shadow-[0_0_40px_rgba(212,175,55,0.4)] uppercase" 
                />
              );
            })()}
            <p className="text-gold/40 text-xs uppercase tracking-[0.5em] mt-4 font-bold">
              Elite Publication
            </p>
          </motion.div>
        )}

        {(phase === "revealing" || phase === "dispersing") && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10 w-full max-w-sm aspect-[2/3] rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(212,175,55,0.2)] border border-gold/20"
          >
            <img 
              src={imageUrl} 
              alt="Generated Cover" 
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
