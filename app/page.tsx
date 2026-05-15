"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { MAGAZINES, Magazine } from "@/lib/magazines";
import { generateCreativeBrief, generateFallbackBrief, type CreativeBrief } from "@/lib/creative-director";
import { buildImagePrompt } from "@/lib/prompt-builder";
import { GoogleGenAI } from "@google/genai";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, 
  Camera, 
  Image as ImageIcon, 
  Sparkles, 
  Download, 
  Share2, 
  LogOut, 
  Grid, 
  X,
  Instagram,
  Twitter,
  Facebook,
  ChevronLeft,
  Settings,
  Check,
  ArrowLeft,
  Info,
  Shuffle
} from "lucide-react";
import Image from "next/image";
import SettingsScreen from "@/components/SettingsScreen";
import AdScreen from "@/components/AdScreen";
import DustAnimation from "@/components/DustAnimation";
import { resizeImage } from "@/lib/image-utils";
import { MagazineTitle } from "@/components/MagazineTitle";
import { LOCAL_LEGENDS, Variation } from "@/lib/variations";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { 
    profile, 
    gallery, 
    setGallery, 
    addCover, 
    apiKey, 
    setApiKey, 
    currentStep, 
    setCurrentStep, 
    clearProfile,
    draft,
    setDraft
  } = useAppStore();
  
  const [selectedMagazine, setSelectedMagazine] = useState<Magazine | null>(null);
  const [selectionMode, setSelectionMode] = useState<'classic' | 'local-legends' | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const hasInitializedRef = useRef(false);
  const [image, setImage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("");
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load gallery from IndexedDB on mount
  useEffect(() => {
    const loadGallery = async () => {
      try {
        const { get } = await import("idb-keyval");
        const savedGallery = await get("coverstar-gallery");
        if (savedGallery && Array.isArray(savedGallery)) {
          setGallery(savedGallery);
        }
      } catch (error) {
        console.error("Failed to load gallery from IndexedDB:", error);
      }
    };
    loadGallery();
  }, [setGallery]);

  // Save gallery to IndexedDB whenever it changes
  useEffect(() => {
    const saveGallery = async () => {
      try {
        const { set } = await import("idb-keyval");
        await set("coverstar-gallery", gallery);
      } catch (error) {
        console.error("Failed to save gallery to IndexedDB:", error);
      }
    };
    saveGallery();
  }, [gallery]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    
    // Load draft if available
    if (draft && !image && !selectedMagazine && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      if (draft.image) setImage(draft.image);
      if (draft.selectedMagazineId) {
        const mag = MAGAZINES.find(m => m.id === draft.selectedMagazineId);
        if (mag) setSelectedMagazine(mag);
      }
      if (draft.selectedVariationId) {
        const variation = LOCAL_LEGENDS.find(v => v.id === draft.selectedVariationId);
        if (variation) setSelectedVariation(variation);
      }
      setGenderFilter(draft.genderFilter);
      setCurrentStep(draft.currentStep);
      toast.info("Draft loaded from your last session");
    }
  }, [status, router, draft, image, selectedMagazine, setCurrentStep]);

  const handleSaveDraft = () => {
    setDraft({
      selectedMagazineId: selectedMagazine?.id || null,
      selectedVariationId: selectedVariation?.id || null,
      image,
      genderFilter,
      currentStep
    });
    toast.success("Progress saved as draft");
  };

  const filteredMagazines = MAGAZINES.filter(
    (m) => (genderFilter === "all" || m.gender === genderFilter || m.gender === "unisex") &&
           (m.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const loadingMessages = ["Creating your cover...", "Styling your look...", "Almost ready!"];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && profile?.gender && !hasInitializedRef.current) {
      setGenderFilter(profile.gender);
      hasInitializedRef.current = true;
    }
  }, [status, router, profile]);

  useEffect(() => {
    if (generating) {
      let i = 0;
      const interval = setInterval(() => {
        setLoadingMessage(loadingMessages[i % loadingMessages.length]);
        i++;
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [generating]);

  const handleRandomize = () => {
    if (navigator.vibrate) navigator.vibrate(50);
    const randomIndex = Math.floor(Math.random() * filteredMagazines.length);
    const randomMag = filteredMagazines[randomIndex];
    if (randomMag) {
      setSelectedMagazine(randomMag);
      setCurrentStep(2);
      toast.success(`Randomly selected: ${randomMag.name}`);
    }
  };

  const handleTakePhoto = async () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      cameraInputRef.current?.click();
    } else {
      setIsCameraOpen(true);
      setIsUploadModalOpen(false);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        toast.error("Could not access camera. Please check permissions.");
        setIsCameraOpen(false);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Mirror the image for selfie mode
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setImage(dataUrl);
        stopCamera();
        setIsCameraOpen(false);
        toast.success("Portrait captured successfully");
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size must be less than 10MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async (qualitySettings?: { resolution?: string; aspectRatio?: string }) => {
    if (!image || !selectedMagazine || !apiKey) return;

    setGenerating(true);
    setShowAd(true);
    setResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const gender = (profile?.gender as "male" | "female") || "female";

      let coverStarGender: "male" | "female" = gender;
      if (selectedMagazine.gender !== "unisex") {
        coverStarGender = gender;
      }
      if (selectedMagazine.id === "maxim" && selectedMagazine.coverStarGender) {
        coverStarGender = selectedMagazine.coverStarGender as "male" | "female";
      }

      let brief: CreativeBrief;

      try {
        brief = await generateCreativeBrief(apiKey, selectedMagazine, coverStarGender);
      } catch (phase1Error: unknown) {
        if (process.env.NODE_ENV === "development") {
          brief = generateFallbackBrief(selectedMagazine);
        } else {
          const message = phase1Error instanceof Error ? phase1Error.message : "Creative brief generation failed";
          throw new Error(message);
        }
      }

      const prompt = buildImagePrompt(
        selectedMagazine,
        brief,
        coverStarGender,
        profile?.name,
        selectedVariation || undefined,
        qualitySettings
      );

      const resizedImage = await resizeImage(image, qualitySettings?.resolution === "Ultra" ? 1024 : 768, 0.8);
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
            aspectRatio: qualitySettings?.aspectRatio || "3:4",
            imageSize: qualitySettings?.resolution === "Ultra" ? "4K" : qualitySettings?.resolution === "High" ? "2K" : "1K",
          },
        },
      });

      let imageUrl = "";
      let responseText = "";

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const outputMime = part.inlineData.mimeType || "image/png";
            imageUrl = `data:${outputMime};base64,${part.inlineData.data}`;
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

      const cover = {
        id: Date.now().toString(),
        imageUrl: imageUrl,
        originalImageUrl: image,
        magazineName: selectedVariation?.title || selectedMagazine.name,
        magazineId: selectedMagazine.id,
        variationId: selectedVariation?.id || null,
        gender: coverStarGender,
        brief: brief,
        createdAt: new Date().toISOString(),
      };

      addCover(cover);
      setDraft(null); // Clear draft on success
      router.push(`/result/${cover.id}`);

    } catch (error: unknown) {
      console.error("Generation error:", error);

      const message = error instanceof Error ? error.message : "Failed to generate cover";

      if (message.includes("429")) {
        toast.error("Quota exceeded. Please check your plan and billing at ai.google.dev.");
      } else {
        toast.error(message);
      }

      setShowAd(false);
      setGenerating(false);
    }
  };

  const handleAdComplete = useCallback(() => {
    setShowAd(false);
    setShowAnimation(true);
  }, []);

  const handleAnimationComplete = useCallback(() => {
    setShowAnimation(false);
    setGenerating(false);
  }, []);

  const resetFlow = () => {
    setImage(null);
    setSelectedMagazine(null);
    setCurrentStep(1);
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col bg-obsidian text-white selection:bg-gold/30">
      {/* Ad and Animation Overlays */}
      <AnimatePresence>
        {showAd && <AdScreen onComplete={handleAdComplete} isReady={!!result} />}
        {showAnimation && (
          <DustAnimation 
            title={selectedVariation?.title || selectedMagazine?.name || "CoverStar"} 
            imageUrl={result || ""} 
            onComplete={handleAnimationComplete} 
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex-shrink-0 p-2 lg:p-4 flex justify-between items-center border-b border-gold/10 bg-obsidian/80 backdrop-blur-xl z-20 w-full h-auto lg:h-[80px]">
        <div 
          className="flex flex-col cursor-pointer group pl-1 lg:pl-0"
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(50);
            setCurrentStep(1);
            setSelectionMode(null);
            setSelectedMagazine(null);
            setSelectedVariation(null);
            setImage(null);
            setResult(null);
          }}
        >
          <h1 className="text-xl lg:text-3xl font-serif font-bold tracking-tighter italic text-gold-gradient leading-none group-hover:scale-105 transition-transform duration-500">
            CoverStar
          </h1>
          <span className="text-[8px] lg:text-[10px] uppercase tracking-[0.4em] text-gold/40 font-bold mt-1 lg:mt-2">
            Elite Studio
          </span>
        </div>
        
        <nav className="flex items-center space-x-2 lg:space-x-6">
          <Button 
            variant="ghost" 
            size="default" 
            onClick={() => router.push("/gallery")}
            className="text-gold/50 hover:text-gold hover:bg-gold/10 px-2 lg:px-6 h-9 lg:h-12 transition-all group"
          >
            <Grid className="w-4 h-4 lg:w-5 lg:h-5 lg:mr-2 group-hover:scale-110 transition-transform" />
            <span className="hidden lg:inline text-xs font-bold uppercase tracking-widest">Gallery</span>
          </Button>
          <Button 
            variant="ghost" 
            size="default" 
            onClick={() => setCurrentStep(0)}
            className="text-gold/50 hover:text-gold hover:bg-gold/10 px-2 lg:px-6 h-9 lg:h-12 transition-all group"
          >
            <Settings className="w-4 h-4 lg:w-5 lg:h-5 lg:mr-2 group-hover:rotate-90 transition-transform duration-500" />
            <span className="hidden lg:inline text-xs font-bold uppercase tracking-widest">Settings</span>
          </Button>
          <Button 
            variant="ghost" 
            size="default" 
            onClick={() => {
              clearProfile();
              signOut();
            }}
            className="text-ruby/50 hover:text-ruby hover:bg-ruby/10 px-2 lg:px-6 h-9 lg:h-12 transition-all group"
          >
            <LogOut className="w-4 h-4 lg:w-5 lg:h-5 lg:mr-2 group-hover:translate-x-1 transition-transform" />
            <span className="hidden lg:inline text-xs font-bold uppercase tracking-widest">Logout</span>
          </Button>
        </nav>
      </header>

      <main className="flex-1 min-h-0 w-full max-w-[1440px] mx-auto flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Step 0: Settings / API Key */}
          {currentStep === 0 && (
            <div className="flex-1 min-height-0 overflow-y-auto lg:overflow-hidden flex items-center justify-center">
              <SettingsScreen key="settings" />
            </div>
          )}

          {/* Step 1: Magazine / Category Selector */}
          {currentStep === 1 && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col min-h-0 p-4 space-y-3 lg:space-y-6"
            >
              {/* Category Selection View */}
              {!selectionMode ? (
                <div className="flex-1 flex flex-col space-y-6 lg:space-y-12 items-center justify-center max-w-5xl mx-auto w-full">
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl lg:text-6xl font-serif font-bold tracking-tighter italic text-gold-gradient">
                      Choose Your Path
                    </h2>
                    <p className="text-gold/40 text-xs lg:text-sm uppercase tracking-[0.3em] font-bold">
                      SELECT A COLLECTION TO BEGIN
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 lg:gap-10 w-full px-2 lg:px-0">
                    {/* Classic Card */}
                    <motion.button
                      whileHover={{ scale: 1.02, y: -10 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectionMode('classic')}
                      className="relative aspect-[3/4] lg:aspect-[4/5] rounded-xl lg:rounded-2xl border border-gold/20 overflow-hidden group transition-all duration-500 hover:border-gold/50 hover:shadow-[0_0_50px_rgba(212,175,55,0.15)]"
                    >
                      <Image
                        src="https://picsum.photos/seed/classic-magazine/800/1000"
                        alt="Classic Collection"
                        fill
                        className="object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/20 to-transparent" />
                      <div className="absolute inset-0 p-3 lg:p-10 flex flex-col justify-end items-center text-center">
                        <h3 className="text-lg lg:text-4xl font-serif font-bold italic text-white mb-1 lg:mb-2 leading-tight">Classic</h3>
                        <p className="text-gold/60 text-[7px] lg:text-xs uppercase tracking-widest font-bold">
                          Iconic Titles
                        </p>
                      </div>
                    </motion.button>

                    {/* Local Legends Card */}
                    <motion.button
                      whileHover={{ scale: 1.02, y: -10 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectionMode('local-legends')}
                      className="relative aspect-[3/4] lg:aspect-[4/5] rounded-xl lg:rounded-2xl border border-gold/20 overflow-hidden group transition-all duration-500 hover:border-gold/50 hover:shadow-[0_0_50px_rgba(212,175,55,0.15)]"
                    >
                      <Image
                        src="https://picsum.photos/seed/local-legends/800/1000"
                        alt="Local Legends"
                        fill
                        className="object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/20 to-transparent" />
                      <div className="absolute inset-0 p-3 lg:p-10 flex flex-col justify-end items-center text-center">
                        <h3 className="text-lg lg:text-4xl font-serif font-bold italic text-white mb-1 lg:mb-2 leading-tight">Local Legends</h3>
                        <p className="text-gold/60 text-[7px] lg:text-xs uppercase tracking-widest font-bold">
                          Cultural Icons
                        </p>
                      </div>
                    </motion.button>

                    {/* Captivated Card (Locked) */}
                    <div className="relative aspect-[3/4] lg:aspect-[4/5] col-span-2 md:col-span-1 rounded-xl lg:rounded-2xl border border-white/5 overflow-hidden group grayscale opacity-50 cursor-not-allowed">
                      <Image
                        src="https://picsum.photos/seed/captivated/800/1000"
                        alt="Captivated Collection"
                        fill
                        className="object-cover opacity-30"
                      />
                      <div className="absolute inset-0 bg-obsidian/60 backdrop-blur-[2px]" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                        <div className="w-8 h-8 lg:w-12 lg:h-12 rounded-full bg-white/10 flex items-center justify-center mb-2 lg:mb-4">
                          <X className="w-4 h-4 lg:w-6 lg:h-6 text-white/40" />
                        </div>
                        <h3 className="text-lg lg:text-4xl font-serif font-bold italic text-white/40 mb-1 lg:mb-2">Captivated</h3>
                        <p className="text-white/20 text-[7px] lg:text-xs uppercase tracking-widest font-bold">
                          Coming Soon
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : selectionMode === 'classic' ? (
                <>
                  <div className="flex items-center justify-between flex-shrink-0">
                    <Button
                      variant="ghost"
                      onClick={() => setSelectionMode(null)}
                      className="text-gold/60 hover:text-gold hover:bg-gold/10"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back to Categories
                    </Button>
                    <div className="text-center space-y-0.5 lg:space-y-1">
                      <h2 className="text-xl lg:text-4xl font-serif font-bold tracking-tighter italic text-gold-gradient">
                        Classic Editions
                      </h2>
                    </div>
                    <div className="w-24" /> {/* Spacer */}
                  </div>

                  <div className="flex-1 flex flex-col min-h-0 space-y-3 lg:space-y-4">
                    {/* Filters and Search on Single Row */}
                    <div className="flex items-center justify-center space-x-2 flex-shrink-0">
                      <div className="flex bg-gold/5 rounded-xl p-0.5 lg:p-1 border border-gold/10 flex-1 lg:max-w-[400px]">
                        <button
                          onClick={() => setGenderFilter("all")}
                          className={`flex-1 py-1.5 lg:py-2 text-[8px] lg:text-[10px] font-bold rounded-lg transition-all uppercase tracking-widest ${
                            genderFilter === "all" ? "bg-gold text-obsidian shadow-lg" : "text-gold/40 hover:text-gold/60"
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setGenderFilter("female")}
                          className={`flex-1 py-1.5 lg:py-2 text-[8px] lg:text-[10px] font-bold rounded-lg transition-all uppercase tracking-widest ${
                            genderFilter === "female" ? "bg-gold text-obsidian shadow-lg" : "text-gold/40 hover:text-gold/60"
                          }`}
                        >
                          Women
                        </button>
                        <button
                          onClick={() => setGenderFilter("male")}
                          className={`flex-1 py-1.5 lg:py-2 text-[8px] lg:text-[10px] font-bold rounded-lg transition-all uppercase tracking-widest ${
                            genderFilter === "male" ? "bg-gold text-obsidian shadow-lg" : "text-gold/40 hover:text-gold/60"
                          }`}
                        >
                          Men
                        </button>
                      </div>
                      <div className="relative flex items-center space-x-1.5 lg:space-x-2 flex-shrink-0">
                        <div className="relative w-24 lg:w-48">
                          <Input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-obsidian/50 border-gold/10 focus:border-gold/30 h-8 lg:h-11 text-[9px] lg:text-sm italic font-serif px-2"
                          />
                        </div>
                        <Button
                          variant="outline"
                          onClick={handleRandomize}
                          className="h-8 w-8 lg:h-11 lg:w-11 p-0 border-gold/10 hover:border-gold/30 bg-gold/5 text-gold/60 hover:text-gold transition-all hover:scale-105"
                          title="Randomize Selection"
                        >
                          <Shuffle className="w-3.5 h-3.5 lg:w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Scrollable Grid Area */}
                    <div className="flex-1 min-h-0 overflow-y-auto pr-1 lg:pr-4 custom-scrollbar no-scrollbar">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-6 pb-4">
                        {filteredMagazines.length > 0 ? (
                          filteredMagazines.map((mag) => (
                            <motion.button
                              key={mag.id}
                              whileHover={{ scale: 1.05, y: -4 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                setSelectedMagazine(mag);
                                setSelectedVariation(null);
                                setCurrentStep(2);
                              }}
                              className={`relative group aspect-[3/4.2] lg:aspect-[3/4] rounded-xl border overflow-hidden transition-all duration-500 ${
                                selectedMagazine?.id === mag.id
                                  ? "border-gold shadow-[0_0_40px_rgba(212,175,55,0.3)]"
                                  : "border-gold/10 hover:border-gold/40 hover:shadow-[0_0_30px_rgba(212,175,55,0.2)]"
                              }`}
                            >
                              <Image
                                src={
                                  genderFilter === "male" && mag.thumbnailMale 
                                    ? mag.thumbnailMale 
                                    : genderFilter === "female" && mag.thumbnailFemale 
                                      ? mag.thumbnailFemale 
                                      : mag.thumbnail
                                }
                                alt={mag.name}
                                fill
                                className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500" />
                              <div className="absolute inset-0 flex flex-col items-center justify-end p-2 lg:p-4 text-center">
                                {mag.id === "time" ? (
                                  <span
                                    className="px-3 py-1 bg-red-600 text-white text-xl lg:text-2xl tracking-widest drop-shadow-lg"
                                    style={{ fontFamily: mag.uiFont, fontWeight: mag.uiFontWeight }}
                                  >
                                    {mag.name}
                                  </span>
                                ) : (
                                  <MagazineTitle
                                    magazine={mag}
                                    className="text-xl lg:text-2xl tracking-wide drop-shadow-lg text-white"
                                  />
                                )}
                                <span className="text-[6px] lg:text-[8px] uppercase tracking-widest text-gold/40 font-bold mt-0.5 lg:mt-1">
                                  {mag.gender === 'female' ? 'Fashion & Style' : 'Lifestyle & Culture'}
                                </span>
                              </div>
                              {selectedMagazine?.id === mag.id && (
                                <div className="absolute top-2 right-2 lg:top-4 lg:right-4 bg-gold text-obsidian p-1 lg:p-1.5 rounded-full shadow-lg">
                                  <Check className="w-2 h-2 lg:w-3.5 lg:h-3.5 stroke-[3]" />
                                </div>
                              )}
                            </motion.button>
                          ))
                        ) : (
                          <div className="col-span-full py-10 text-center text-gold/20 font-serif italic text-lg">
                            No matching editions found.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between flex-shrink-0">
                    <Button
                      variant="ghost"
                      onClick={() => setSelectionMode(null)}
                      className="text-gold/60 hover:text-gold hover:bg-gold/10"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back to Categories
                    </Button>
                    <div className="text-center space-y-0.5 lg:space-y-1">
                      <h2 className="text-xl lg:text-4xl font-serif font-bold tracking-tighter italic text-gold-gradient">
                        Local Legends
                      </h2>
                    </div>
                    <div className="w-24" /> {/* Spacer */}
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto pr-1 lg:pr-4 custom-scrollbar no-scrollbar">
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-6 pb-8 px-2 lg:px-0">
                      {LOCAL_LEGENDS.map((variation) => (
                        <motion.button
                          key={variation.id}
                          whileHover={{ scale: 1.03, y: -4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            const mag = MAGAZINES.find(m => m.id === variation.magazineId) || MAGAZINES[0];
                            setSelectedMagazine(mag);
                            setSelectedVariation(variation);
                            setCurrentStep(2);
                          }}
                          className="relative group aspect-[3/4] rounded-xl lg:rounded-2xl border border-gold/10 overflow-hidden bg-obsidian/40 transition-all duration-500 hover:border-gold/40 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)]"
                        >
                          <Image
                            src={variation.thumbnail}
                            alt={variation.title}
                            fill
                            className="object-cover opacity-60 group-hover:opacity-80 transition-all duration-700 group-hover:scale-110"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent" />
                          <div className="absolute inset-0 p-2 lg:p-4 flex flex-col justify-end">
                            <span className="text-[6px] lg:text-[10px] uppercase tracking-[0.2em] text-gold/60 font-bold mb-0.5 lg:mb-1">
                              {variation.magazineName}
                            </span>
                            <h3 className="text-xs lg:text-xl font-serif font-bold italic text-white leading-tight">
                              {variation.title}
                            </h3>
                            <p className="hidden lg:block text-[10px] text-white/40 line-clamp-2 mt-1 italic">
                              {variation.description}
                            </p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Step 2: Image Upload */}
          {currentStep === 2 && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col min-h-0 p-4 space-y-3 lg:space-y-6 max-w-5xl mx-auto w-full"
            >
              <div className="flex items-center justify-between flex-shrink-0">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep(1)}
                  className="text-gold/60 hover:text-gold hover:bg-gold/10"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Selection
                </Button>
                <div className="text-center space-y-0.5 lg:space-y-1">
                  <h2 className="text-xl lg:text-4xl font-serif font-bold tracking-tighter italic text-gold-gradient">
                    Capture Your Essence
                  </h2>
                  <p className="text-gold/40 text-[9px] lg:text-[10px] uppercase tracking-[0.2em] lg:tracking-[0.3em] font-bold">
                    UPLOAD YOUR PORTRAIT FOR THE COVER
                  </p>
                </div>
                <div className="w-24" />
              </div>

              <div className="flex-1 min-h-0 w-full flex flex-col lg:flex-row gap-4 lg:gap-12 overflow-y-auto lg:overflow-hidden no-scrollbar">
                {/* Upload Zone - Large on Mobile */}
                <div className="w-full lg:flex-1 flex items-center justify-center min-h-[300px] lg:min-h-0">
                  <div
                    onClick={() => setIsUploadModalOpen(true)}
                    className={`relative aspect-[3/4] w-full max-w-[280px] sm:max-w-[320px] lg:max-w-none lg:h-full lg:max-h-[60vh] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-700 group ${
                      image ? "border-gold shadow-[0_0_60px_rgba(212,175,55,0.2)]" : "border-gold/10 hover:border-gold/30 bg-gold/5"
                    }`}
                  >
                    {image ? (
                      <>
                        <Image
                          src={image}
                          alt="Preview"
                          fill
                          className="object-contain lg:object-cover transition-transform duration-1000 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-obsidian/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="px-5 py-2 bg-gold text-obsidian rounded-full font-bold text-[9px] lg:text-xs uppercase tracking-widest shadow-2xl">
                            Change Portrait
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6 lg:p-12">
                        <div className="w-10 h-10 lg:w-24 lg:h-24 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-6 group-hover:scale-110 transition-transform duration-700">
                          <Camera className="w-5 h-5 lg:w-12 lg:h-12 text-gold" />
                        </div>
                        <p className="text-sm lg:text-2xl font-serif font-bold italic text-gold mb-1 lg:mb-2">Select Portrait</p>
                        <p className="text-[7px] lg:text-[10px] text-gold/30 uppercase tracking-widest font-bold">Tap to choose</p>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={galleryInputRef}
                      onChange={(e) => {
                        handleImageUpload(e);
                        setIsUploadModalOpen(false);
                      }}
                      accept="image/*"
                      className="hidden"
                    />
                    <input
                      type="file"
                      ref={cameraInputRef}
                      onChange={(e) => {
                        handleImageUpload(e);
                        setIsUploadModalOpen(false);
                      }}
                      accept="image/*"
                      capture="user"
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="w-full lg:w-[400px] flex flex-col space-y-3 lg:space-y-6 flex-shrink-0">
                  {/* Guidelines */}
                  <div className="p-3 lg:p-6 bg-obsidian/50 border border-gold/10 rounded-xl lg:rounded-2xl space-y-2 lg:space-y-4">
                    <div className="flex items-center space-x-2 text-gold/60">
                      <Info className="w-3 h-3 lg:w-5 lg:h-5" />
                      <span className="text-[8px] lg:text-[10px] uppercase tracking-widest font-bold">Guidelines</span>
                    </div>
                    <ul className="flex flex-row lg:flex-col gap-3 lg:gap-4 justify-center lg:justify-start">
                      {[
                        "Clear lighting",
                        "Face forward",
                        "Neutral background"
                      ].map((tip, i) => (
                        <li key={i} className="text-[7px] lg:text-[10px] text-gold/40 flex items-center space-x-1.5">
                          <div className="w-1 h-1 bg-gold rounded-full" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Generate Button - Desktop only here */}
                  <div className="hidden lg:flex flex-col space-y-3">
                    <Button
                      onClick={() => {
                        if (navigator.vibrate) navigator.vibrate(50);
                        handleGenerate();
                      }}
                      disabled={!image || !selectedMagazine || generating}
                      variant="luxury"
                      className="w-full h-20 text-xl shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      {generating ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 border-2 border-obsidian border-t-transparent rounded-full animate-spin"></div>
                          <span>{loadingMessage}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Sparkles className="w-7 lg:w-7 h-7 lg:h-7" />
                          <span>Generate Masterpiece</span>
                        </div>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleSaveDraft}
                      disabled={!image && !selectedMagazine}
                      className="text-gold/40 hover:text-gold text-[10px] uppercase tracking-widest font-bold"
                    >
                      Save as Draft
                    </Button>
                  </div>
                </div>
              </div>

              {/* Generate Button - Mobile Fixed at bottom of main */}
              <div className="lg:hidden flex flex-col space-y-2 flex-shrink-0 pt-2">
                <Button
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(50);
                    handleGenerate();
                  }}
                  disabled={!image || !selectedMagazine || generating}
                  variant="luxury"
                  className="w-full h-12 text-sm shadow-2xl active:scale-[0.98] transition-all"
                >
                  {generating ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-obsidian border-t-transparent rounded-full animate-spin"></div>
                      <span>{loadingMessage}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-5 h-5" />
                      <span>Generate Masterpiece</span>
                    </div>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleSaveDraft}
                  disabled={!image && !selectedMagazine}
                  className="text-gold/40 hover:text-gold text-[8px] uppercase tracking-widest font-bold h-8"
                >
                  Save as Draft
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Branding */}
      <footer className="flex-shrink-0 p-2 text-center border-t border-gold/5 h-auto lg:h-[40px] flex items-center justify-center pb-[calc(env(safe-area-inset-bottom,0px)+4px)]">
        <div className="flex flex-col items-center space-y-0.5">
          <div className="hidden lg:block w-8 h-px bg-gold/20" />
          <p className="text-[7px] lg:text-[10px] text-gold/20 uppercase tracking-[0.4em] font-bold">
            Powered by Gemini AI • Elite Studio
          </p>
        </div>
      </footer>

      {/* Upload Selection Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute inset-0 bg-obsidian/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-obsidian border border-gold/20 rounded-3xl p-8 shadow-[0_0_50px_rgba(212,175,55,0.2)] space-y-6"
            >
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="absolute top-4 right-4 text-gold/40 hover:text-gold transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center space-y-2">
                <h3 className="text-2xl font-serif font-bold italic text-gold-gradient">Choose Method</h3>
                <p className="text-[10px] text-gold/40 uppercase tracking-widest font-bold">Select how you want to provide your portrait</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Button
                  variant="outline"
                  onClick={handleTakePhoto}
                  className="h-20 border-gold/10 hover:border-gold/30 bg-gold/5 text-gold/60 hover:text-gold flex flex-col items-center justify-center space-y-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Camera className="w-8 h-8" />
                  <span className="text-xs uppercase tracking-widest font-bold">Take Photo</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => galleryInputRef.current?.click()}
                  className="h-20 border-gold/10 hover:border-gold/30 bg-gold/5 text-gold/60 hover:text-gold flex flex-col items-center justify-center space-y-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Upload className="w-8 h-8" />
                  <span className="text-xs uppercase tracking-widest font-bold">Upload from Gallery</span>
                </Button>
              </div>

              <Button
                variant="ghost"
                onClick={() => setIsUploadModalOpen(false)}
                className="w-full text-gold/40 hover:text-gold text-[10px] uppercase tracking-widest font-bold"
              >
                Cancel
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Camera Modal */}
      <AnimatePresence>
        {isCameraOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-obsidian">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full h-full flex flex-col items-center justify-center p-4"
            >
              <div className="relative w-full max-w-4xl aspect-[4/3] overflow-hidden rounded-3xl border border-gold/20 shadow-[0_0_50px_rgba(212,175,55,0.2)]">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                <div className="absolute inset-0 border-[40px] border-obsidian/40 pointer-events-none" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[80%] h-[80%] border border-gold/20 rounded-[20%] border-dashed" />
                </div>
              </div>
              
              <div className="mt-8 flex items-center space-x-12">
                <Button
                  variant="ghost"
                  onClick={() => {
                    stopCamera();
                    setIsCameraOpen(false);
                  }}
                  className="w-16 h-16 rounded-full border border-gold/10 bg-gold/5 text-gold/40 hover:text-gold transition-all"
                >
                  <X className="w-8 h-8" />
                </Button>
                
                <Button
                  onClick={capturePhoto}
                  className="w-24 h-24 rounded-full bg-gold text-obsidian hover:scale-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(212,175,55,0.5)] flex items-center justify-center group"
                >
                  <div className="w-16 h-16 rounded-full border-4 border-obsidian/20 group-hover:border-obsidian/40 transition-colors" />
                </Button>

                <div className="w-16 h-16" /> {/* Spacer for symmetry */}
              </div>
              
              <div className="absolute top-8 text-center">
                <h3 className="text-2xl font-serif font-bold italic text-gold-gradient">Elite Portrait Studio</h3>
                <p className="text-[10px] text-gold/40 uppercase tracking-widest font-bold mt-2">Position yourself within the frame</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
