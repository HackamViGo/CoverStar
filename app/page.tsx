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

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { profile, gallery, setGallery, addCover, apiKey, setApiKey, currentStep, setCurrentStep, clearProfile } = useAppStore();
  
  const [selectedMagazine, setSelectedMagazine] = useState<Magazine | null>(null);
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const hasInitializedRef = useRef(false);
  const [image, setImage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("");
  
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

  const handleGenerate = async () => {
    if (!image || !selectedMagazine || !apiKey) return;

    setGenerating(true);
    setShowAd(true);
    setResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const gender = (profile?.gender as "male" | "female") || "female";

      // Determine the effective cover star gender.
      // For unisex magazines, the cover star gender matches the user's profile gender.
      // For gendered magazines, use the magazine's defined gender.
      // Special case: Maxim's cover star is always female regardless of user gender.
      let coverStarGender: "male" | "female" = gender;
      if (selectedMagazine.gender !== "unisex") {
        // For strongly gendered magazines like Vogue (female) or Men's Health (male),
        // the cover star gender is determined by who would realistically be on the cover.
        // Since the user already filtered magazines by their own gender in the UI,
        // coverStarGender = gender is correct.
        coverStarGender = gender;
      }
      // Maxim override: cover star is almost always female
      if (selectedMagazine.id === "maxim" && selectedMagazine.coverStarGender) {
        coverStarGender = selectedMagazine.coverStarGender as "male" | "female";
      }

      // ============================================================
      // PHASE 1: Creative Director (gemini-2.5-flash-lite — ~0.5s)
      // ============================================================
      let brief: CreativeBrief;

      try {
        brief = await generateCreativeBrief(apiKey, selectedMagazine, coverStarGender);
        
        if (process.env.NODE_ENV === "development") {
          console.log("[Phase 1] ✅ Creative brief generated:", JSON.stringify(brief, null, 2));
        }
      } catch (phase1Error: unknown) {
        // DEV-ONLY FALLBACK: use enhanced static pools from magazine DNA
        if (process.env.NODE_ENV === "development") {
          console.warn("[Phase 1] ❌ Failed, using fallback:", phase1Error);
          brief = generateFallbackBrief(selectedMagazine);
          console.log("[Phase 1 Fallback] 🔄 Brief:", JSON.stringify(brief, null, 2));
        } else {
          // PRODUCTION: propagate the error — user sees a toast
          const message = phase1Error instanceof Error ? phase1Error.message : "Creative brief generation failed";
          throw new Error(message);
        }
      }

      // ============================================================
      // PHASE 2: Image Synthesis (gemini-2.5-flash-image — ~10-15s)
      // ============================================================
      const prompt = buildImagePrompt(
        selectedMagazine,
        brief,
        coverStarGender,
        profile?.name
      );

      if (process.env.NODE_ENV === "development") {
        console.log("[Phase 2] 🎨 Prompt length:", prompt.length, "chars");
        console.log("[Phase 2] 📝 Full prompt:\n", prompt);
      }

      // Extract base64 data from the user's uploaded image
      const base64Data = image.split(",")[1];
      const mimeType = image.split(";")[0].split(":")[1];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "3:4",
          },
        },
      });

      // ============================================================
      // RESPONSE PARSING
      // ============================================================
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

      // ============================================================
      // ERROR HANDLING
      // ============================================================
      if (!imageUrl) {
        const candidate = response.candidates?.[0];
        const finishReason = candidate?.finishReason;

        if (finishReason === "SAFETY") {
          throw new Error(
            "The image was blocked by safety filters. Please try a different photo or magazine style."
          );
        }
        if (finishReason === "RECITATION") {
          throw new Error(
            "The image was blocked due to copyright/recitation filters. Try a different magazine."
          );
        }
        if (finishReason === "OTHER") {
          throw new Error(
            "Generation failed for an unknown reason. This can happen with complex prompts. Please try again."
          );
        }

        throw new Error(
          responseText ||
            `Failed to generate image (Status: ${finishReason || "No Response"}). Please try again or check your API key.`
        );
      }

      // ============================================================
      // SUCCESS: Save cover and navigate
      // ============================================================
      const cover = {
        id: Date.now().toString(),
        imageUrl: imageUrl,
        magazineName: selectedMagazine.name,
        createdAt: new Date().toISOString(),
      };

      addCover(cover);
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
            title={selectedMagazine?.name || "CoverStar"} 
            imageUrl={result || ""} 
            onComplete={handleAnimationComplete} 
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex-shrink-0 p-3 lg:p-4 flex justify-between items-center border-b border-gold/10 bg-obsidian/80 backdrop-blur-xl z-20 w-full h-auto lg:h-[80px]">
        <div 
          className="flex flex-col cursor-pointer group"
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(50);
            setCurrentStep(1);
            setSelectedMagazine(null);
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

          {/* Step 1: Magazine Selector */}
          {currentStep === 1 && (
            <motion.div
              key="magazines"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col min-h-0 p-4 space-y-3 lg:space-y-6"
            >
              <div className="text-center space-y-0.5 lg:space-y-1 flex-shrink-0">
                <h2 className="text-xl lg:text-4xl font-serif font-bold tracking-tighter italic text-gold-gradient">
                  Select Your Edition
                </h2>
                <p className="text-gold/40 text-[9px] lg:text-[10px] uppercase tracking-[0.2em] lg:tracking-[0.3em] font-bold whitespace-nowrap overflow-hidden text-ellipsis">
                  CHOOSE A TEMPLATE FOR YOUR MASTERPIECE
                </p>
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
                    <div className="relative w-20 lg:w-48">
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
                            <span className="text-sm lg:text-xl font-serif font-bold italic tracking-tight text-gold">
                              {mag.name}
                            </span>
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
              <div className="text-center space-y-0.5 lg:space-y-1 flex-shrink-0">
                <h2 className="text-xl lg:text-4xl font-serif font-bold tracking-tighter italic text-gold-gradient">
                  Capture Your Essence
                </h2>
                <p className="text-gold/40 text-[9px] lg:text-[10px] uppercase tracking-[0.2em] lg:tracking-[0.3em] font-bold">
                  UPLOAD YOUR PORTRAIT FOR THE COVER
                </p>
              </div>

              <div className="flex-1 min-h-0 w-full flex flex-col lg:flex-row gap-4 lg:gap-12 overflow-y-auto lg:overflow-hidden no-scrollbar">
                {/* Upload Zone - Large on Mobile */}
                <div className="w-full lg:flex-1 flex items-center justify-center min-h-[300px] lg:min-h-0">
                  <div
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.removeAttribute("capture");
                        fileInputRef.current.click();
                      }
                    }}
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
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="w-full lg:w-[400px] flex flex-col space-y-3 lg:space-y-6 flex-shrink-0">
                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.setAttribute("capture", "user");
                          fileInputRef.current.click();
                        }
                      }}
                      className="h-10 lg:h-16 border-gold/10 hover:border-gold/30 bg-gold/5 text-gold/60 hover:text-gold space-x-2 transition-all hover:scale-105"
                    >
                      <Camera className="w-4 h-4 lg:w-6 lg:h-6" />
                      <span className="text-[8px] lg:text-[10px] uppercase tracking-widest font-bold">Take Photo</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.removeAttribute("capture");
                          fileInputRef.current.click();
                        }
                      }}
                      className="h-10 lg:h-16 border-gold/10 hover:border-gold/30 bg-gold/5 text-gold/60 hover:text-gold space-x-2 transition-all hover:scale-105"
                    >
                      <Upload className="w-4 h-4 lg:w-6 lg:h-6" />
                      <span className="text-[8px] lg:text-[10px] uppercase tracking-widest font-bold">Upload</span>
                    </Button>
                  </div>

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
                  <div className="hidden lg:block">
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
                  </div>
                </div>
              </div>

              {/* Generate Button - Mobile Fixed at bottom of main */}
              <div className="lg:hidden flex-shrink-0 pt-2">
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
    </div>
  );
}
