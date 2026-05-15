"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import React, { useRef } from "react";
import Image from "next/image";

interface Magazine3DCardProps {
  imageUrl: string;
  animation?: "none" | "shimmer" | "particles";
}

export const Magazine3DCard: React.FC<Magazine3DCardProps> = ({ imageUrl, animation = "none" }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-full perspective-1000 group cursor-grab active:cursor-grabbing"
      style={{ perspective: "1200px" }}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative w-full h-full rounded-xl lg:rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(212,175,55,0.15)] border border-gold/20 transition-all duration-200"
      >
        <Image
          src={imageUrl}
          alt="Magazine Cover"
          fill
          priority
          className="object-contain pointer-events-none"
          referrerPolicy="no-referrer"
        />

        {/* Shimmer Effect */}
        {animation === "shimmer" && (
          <motion.div
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
          />
        )}

        {/* Particle Effect (Subtle Dust) */}
        {animation === "particles" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * 100 + "%", 
                  y: Math.random() * 100 + "%",
                  opacity: 0 
                }}
                animate={{ 
                  y: [null, "-10%"],
                  opacity: [0, 0.5, 0]
                }}
                transition={{
                  duration: Math.random() * 5 + 5,
                  repeat: Infinity,
                  delay: Math.random() * 5,
                  ease: "linear"
                }}
                className="absolute w-1 h-1 bg-gold/40 rounded-full blur-[1px]"
              />
            ))}
          </div>
        )}

        {/* Gloss Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
        
        {/* 3D Depth Shadow */}
        <div 
          style={{ transform: "translateZ(-20px)" }}
          className="absolute inset-0 bg-black/40 blur-xl scale-95 pointer-events-none" 
        />
      </motion.div>
    </div>
  );
};
