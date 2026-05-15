"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Download, Share2, ChevronLeft, Sparkles, ShieldCheck, Wand2, MousePointer2, Image as ImageIcon, RefreshCw, Layers, Maximize, Settings2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { MAGAZINES } from "@/lib/magazines";
import { MagazineTitle } from "@/components/MagazineTitle";
import { Magazine3DCard } from "@/components/Magazine3DCard";
import { ShareModal } from "@/components/ShareModal";
import { GoogleGenAI } from "@google/genai";
import { buildImagePrompt } from "@/lib/prompt-builder";
import { resizeImage } from "@/lib/image-utils";
import AdScreen from "@/components/AdScreen";
import DustAnimation from "@/components/DustAnimation";
import { useCallback } from "react";


const headlines = [
  {
    title: "A Cover Star is Born",
    subtitle: "Share your moment with the world"
  },
  {
    title: "You Belong on the Cover",
    subtitle: "The spotlight was always yours"
  },
  {
    title: "You Were Born for This",
    subtitle: "Own it. Share it. Inspire."
  },
  {
    title: "The World Needs to See This",
    subtitle: "A masterpiece worth sharing"
  },
  {
    title: "Why Aren't You Famous Yet?",
    subtitle: "Let the world decide"
  }
];

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { gallery, setCurrentStep, apiKey, addCover } = useAppStore();
  const [cover, setCover] = useState<any>(null);
  const [headline, setHeadline] = useState(headlines[0]);
  const [selectedAnimation, setSelectedAnimation] = useState<"none" | "shimmer" | "particles">("none");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [qualitySettings, setQualitySettings] = useState({
    resolution: "Standard",
    aspectRatio: "3:4"
  });

  useEffect(() => {
    const foundCover = gallery.find((c) => c.id === id);
    setCover(foundCover);
    
    // Select random headline
    const randomIndex = Math.floor(Math.random() * headlines.length);
    setHeadline(headlines[randomIndex]);
  }, [id, gallery]);

  const handleRegenerate = async () => {
    if (!cover || !apiKey) return;

    setIsRegenerating(true);
    setShowAd(true);
    setLoadingMessage("Enhancing Masterpiece...");

    try {
      const ai = new GoogleGenAI({ apiKey });
      const mag = MAGAZINES.find(m => m.id === cover.magazineId);
      if (!mag) throw new Error("Magazine not found");

      const prompt = buildImagePrompt(
        mag,
        cover.brief,
        cover.gender,
        undefined, // Name already in brief/prompt if needed
        undefined, // Variation handled in brief/prompt
        qualitySettings
      );

      const resizedImage = await resizeImage(cover.originalImageUrl, qualitySettings.resolution === "Ultra" ? 1024 : 768, 0.8);
      const base64Data = resizedImage.split(",")[1];
      const mimeType = "image/jpeg";

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: qualitySettings.aspectRatio as any,
            imageSize: qualitySettings.resolution === "Ultra" ? "4K" : qualitySettings.resolution === "High" ? "2K" : "1K",
          },
        },
      });

      let imageUrl = "";
      let responseText = "";
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
            break;
          } else if (part.text) {
            responseText += part.text;
          }
        }
      }

      if (!imageUrl) {
        const candidate = response.candidates?.[0];
        const finishReason = candidate?.finishReason;
        const safetyRatings = candidate?.safetyRatings;

        if (finishReason === "SAFETY") {
          const blockedCategories = safetyRatings
            ?.filter(r => r.blocked)
            ?.map(r => r.category)
            ?.join(", ");
          throw new Error(`The image was blocked by safety filters${blockedCategories ? `: ${blockedCategories}` : ""}. Please try a different photo.`);
        }
        
        if (finishReason) {
          throw new Error(responseText || `Model failed to generate image. Reason: ${finishReason}`);
        }
        
        throw new Error(responseText || "The model returned an empty response. This can happen due to high traffic or complex prompts. Please try again.");
      }

      const newCover = {
        ...cover,
        id: Date.now().toString(),
        imageUrl: imageUrl,
        createdAt: new Date().toISOString(),
      };

      addCover(newCover);
      router.push(`/result/${newCover.id}`);
      toast.success("Enhanced cover generated!");

    } catch (error: unknown) {
      console.error("Regeneration error:", error);
      toast.error(error instanceof Error ? error.message : "Regeneration failed");
      setShowAd(false);
      setIsRegenerating(false);
    }
  };

  const handleAdComplete = useCallback(() => {
    setShowAd(false);
    setShowAnimation(true);
  }, []);

  const handleAnimationComplete = useCallback(() => {
    setShowAnimation(false);
    setIsRegenerating(false);
  }, []);

  if (!cover) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-obsidian text-white selection:bg-gold/30 overflow-hidden pt-[env(safe-area-inset-top,0px)]">
      {/* Header */}
      <header className="flex-shrink-0 py-2 lg:py-6 flex items-center max-w-[1440px] mx-auto w-full z-10 px-4 lg:px-0 h-auto lg:h-[80px]">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.push("/")}
          className="text-gold/50 hover:text-gold hover:bg-gold/10 transition-all w-8 h-8 lg:w-12 lg:h-12"
        >
          <ChevronLeft className="w-5 h-5 lg:w-8 lg:h-8" />
        </Button>
        
        <div 
          className="flex flex-col ml-3 lg:ml-8 cursor-pointer group"
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(50);
            setCurrentStep(1);
            router.push("/");
          }}
        >
          <h1 className="text-base md:text-2xl lg:text-3xl font-serif font-bold tracking-tighter italic text-gold-gradient leading-none group-hover:scale-105 transition-transform duration-500">
            Your Masterpiece
          </h1>
          <div className="flex items-center space-x-1 lg:space-x-2 mt-0.5 lg:mt-2">
            <span className="text-[6px] lg:text-[10px] uppercase tracking-[0.4em] text-gold/40 font-bold">
              Elite Edition •
            </span>
            {(() => {
              const mag = MAGAZINES.find(m => m.name === cover.magazineName);
              if (!mag) return <span className="text-[6px] lg:text-[10px] uppercase tracking-[0.4em] text-gold/40 font-bold">{cover.magazineName}</span>;
              
              if (mag.id === "time") {
                return (
                  <span
                    className="px-1.5 py-0.5 bg-red-600 text-white text-[6px] lg:text-[10px] tracking-widest"
                    style={{ fontFamily: mag.uiFont, fontWeight: mag.uiFontWeight }}
                  >
                    {mag.name}
                  </span>
                );
              }
              
              return (
                <MagazineTitle 
                  magazine={mag} 
                  className="text-[6px] lg:text-[10px] uppercase tracking-[0.4em] text-gold/40 font-bold" 
                />
              );
            })()}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-2 lg:gap-12 xl:gap-20 p-0 lg:p-8 max-w-[1440px] mx-auto w-full min-h-0 overflow-hidden">
        {/* Mobile Headline Section */}
        <div className="lg:hidden text-center flex-shrink-0 px-4 py-1">
          <h2 className="result-headline whitespace-nowrap overflow-hidden text-ellipsis">{headline.title}</h2>
          <p className="result-subtitle">{headline.subtitle}</p>
        </div>

        {/* Left Column: Image */}
        <div className="flex-1 lg:flex-1 w-full flex flex-col justify-center items-center min-h-0 px-4 lg:px-0 space-y-4 lg:space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative h-[50vh] lg:h-[calc(100vh-240px)] aspect-[2/3] w-auto"
          >
            <Magazine3DCard imageUrl={cover.imageUrl} animation={selectedAnimation} />
            
            {/* 3D Interaction Hint */}
            <div className="absolute -bottom-8 left-0 right-0 flex justify-center items-center space-x-2 text-gold/30 lg:hidden">
              <MousePointer2 className="w-3 h-3 animate-bounce" />
              <span className="text-[8px] uppercase tracking-widest font-bold">Tilt to explore 3D</span>
            </div>
          </motion.div>

          {/* Animation Selector */}
          <div className="flex items-center space-x-2 lg:space-x-4 bg-gold/5 p-1 lg:p-1.5 rounded-full border border-gold/10">
            {[
              { id: "none", label: "Static", icon: <ImageIcon className="w-3 h-3" /> },
              { id: "shimmer", label: "Shimmer", icon: <Sparkles className="w-3 h-3" /> },
              { id: "particles", label: "Particles", icon: <Wand2 className="w-3 h-3" /> }
            ].map((effect) => (
              <button
                key={effect.id}
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(20);
                  setSelectedAnimation(effect.id as any);
                }}
                className={`flex items-center space-x-1.5 lg:space-x-2 px-3 lg:px-5 py-1.5 lg:py-2 rounded-full text-[8px] lg:text-[10px] font-bold uppercase tracking-widest transition-all ${
                  selectedAnimation === effect.id 
                    ? "bg-gold text-obsidian shadow-lg" 
                    : "text-gold/40 hover:text-gold/60"
                }`}
              >
                {effect.icon}
                <span>{effect.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="flex-shrink-0 w-full lg:w-[40%] xl:w-[35%] flex flex-col space-y-3 lg:space-y-8 p-4 lg:p-0 justify-center lg:h-full pb-[calc(env(safe-area-inset-bottom,0px)+12px)] lg:pb-0">
          <div className="hidden lg:block space-y-4">
            <div className="space-y-2">
              <h2 className="result-headline">
                {headline.title}
              </h2>
              <p className="result-subtitle max-w-md">
                {headline.subtitle}
              </p>
            </div>
            <div className="w-16 h-1 bg-gold/20 rounded-full mt-4" />
          </div>

          <div className="space-y-3 lg:space-y-4 w-full max-w-md mx-auto lg:mx-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <Button
                onClick={() => setIsShareModalOpen(true)}
                variant="luxury"
                className="w-full h-11 lg:h-16 text-sm lg:text-lg shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group"
              >
                <Share2 className="w-5 h-5 lg:w-6 lg:h-6 mr-2 lg:mr-3 group-hover:rotate-12 transition-transform" />
                Share Your Cover
              </Button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex justify-center lg:justify-start"
            >
              <Button
                onClick={() => {
                  if (!cover) return;
                  const link = document.createElement("a");
                  link.href = cover.imageUrl;
                  link.download = `CoverStar-${cover.magazineName}-${Date.now()}.png`;
                  link.click();
                  toast.success("Download started!");
                }}
                variant="ghost"
                className="text-gold/40 hover:text-gold text-[9px] lg:text-[10px] uppercase tracking-[0.3em] font-bold h-8 lg:h-12 px-6 lg:px-8 border border-transparent hover:border-gold/10 rounded-full transition-all"
              >
                <Download className="w-3 h-3 lg:w-4 lg:h-4 mr-2" />
                Secure Download
              </Button>
            </motion.div>
          </div>

          {/* Re-generation Settings */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="space-y-4 bg-gold/5 p-6 rounded-3xl border border-gold/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings2 className="w-4 h-4 text-gold" />
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-gold">Elite Enhancement</h4>
              </div>
              <span className="text-[8px] text-gold/40 font-mono">v3.1 Flash Engine</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[8px] uppercase tracking-widest text-gold/40 font-bold">Resolution</label>
                <div className="flex flex-col space-y-1">
                  {["Standard", "High", "Ultra"].map((res) => (
                    <button
                      key={res}
                      onClick={() => setQualitySettings(prev => ({ ...prev, resolution: res }))}
                      className={`text-left px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${
                        qualitySettings.resolution === res ? "bg-gold/20 text-gold" : "text-gold/20 hover:text-gold/40"
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[8px] uppercase tracking-widest text-gold/40 font-bold">Aspect Ratio</label>
                <div className="flex flex-col space-y-1">
                  {["3:4", "1:1", "4:5"].map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setQualitySettings(prev => ({ ...prev, aspectRatio: ratio }))}
                      className={`text-left px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${
                        qualitySettings.aspectRatio === ratio ? "bg-gold/20 text-gold" : "text-gold/20 hover:text-gold/40"
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="w-full h-12 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/20 rounded-xl text-[10px] uppercase tracking-widest font-bold group"
            >
              <RefreshCw className={`w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-700 ${isRegenerating ? "animate-spin" : ""}`} />
              Re-generate with Elite Settings
            </Button>
          </motion.div>

          {/* Desktop Only Info */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="hidden lg:block space-y-4"
          >
            <div className="flex items-start space-x-3 p-4 rounded-2xl border border-gold/10 bg-gold/5 backdrop-blur-sm">
               <ShieldCheck className="w-5 h-5 text-gold/40 shrink-0 mt-1" />
               <div>
                  <h4 className="text-gold font-bold text-[10px] uppercase tracking-widest mb-1">Authenticity Guaranteed</h4>
                  <p className="text-gold/50 text-xs leading-relaxed">
                    This digital asset is a unique production of the CoverStar Elite Studio. High-fidelity rendering and identity preservation verified.
                  </p>
               </div>
            </div>
            
            <div className="flex justify-between items-center px-2">
               <div className="flex flex-col">
                  <span className="text-[9px] text-gold/30 uppercase tracking-widest font-bold">Resolution</span>
                  <span className="text-gold/60 font-mono text-xs">8K Ultra HD</span>
               </div>
               <div className="flex flex-col text-right">
                  <span className="text-[9px] text-gold/30 uppercase tracking-widest font-bold">Format</span>
                  <span className="text-gold/60 font-mono text-xs">Premium PNG</span>
               </div>
            </div>
          </motion.div>
        </div>
      </main>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        imageUrl={cover.imageUrl}
        magazineName={cover.magazineName}
      />

      <AnimatePresence>
        {showAd && (
          <AdScreen onComplete={handleAdComplete} loadingMessage={loadingMessage} isReady={true} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAnimation && (
          <DustAnimation 
            onComplete={handleAnimationComplete} 
            title={cover.magazineName}
            imageUrl={cover.imageUrl}
          />
        )}
      </AnimatePresence>

      {/* Footer - Hidden on mobile to save space */}
      <footer className="hidden lg:block mt-auto py-4 lg:py-4 px-6 lg:px-10 border-t border-gold/5 h-auto lg:h-[60px]">
        <div className="max-w-[1440px] mx-auto w-full flex flex-col lg:flex-row items-center lg:justify-between space-y-6 lg:space-y-0 h-full">
          <div className="flex flex-col items-center lg:items-start space-y-1">
            <div className="w-8 h-px bg-gold/20" />
            <p className="text-[8px] text-gold/30 uppercase tracking-[0.5em] font-bold">
              Elite Studio • Powered by Gemini AI
            </p>
          </div>
          
          <div className="flex items-center space-x-6">
             <span className="text-[8px] text-gold/10 uppercase tracking-widest">Privacy Policy</span>
             <span className="text-[8px] text-gold/10 uppercase tracking-widest">Terms of Service</span>
             <span className="text-[8px] text-gold/20 uppercase tracking-widest font-bold">© 2026 CoverStar</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
