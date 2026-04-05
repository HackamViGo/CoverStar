"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Key, ExternalLink, Info, CheckCircle, AlertTriangle, User, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

export default function SettingsScreen() {
  const { apiKey, setApiKey, setCurrentStep, profile, setProfile } = useAppStore();
  const [keyInput, setKeyInput] = useState(apiKey || "");
  const [gender, setGender] = useState<"male" | "female">(profile?.gender || "female");
  const [showInstructions, setShowInstructions] = useState(false);
  const [hasAutoAdvanced, setHasAutoAdvanced] = useState(false);

  // Auto-advance only on the very first mount if API key exists
  useEffect(() => {
    const autoAdvanced = sessionStorage.getItem("coverstar-auto-advanced");
    if (apiKey && !autoAdvanced && !hasAutoAdvanced) {
      sessionStorage.setItem("coverstar-auto-advanced", "true");
      setHasAutoAdvanced(true);
      setCurrentStep(1);
    }
  }, [apiKey, setCurrentStep, hasAutoAdvanced]);

  const handleSave = () => {
    if (!keyInput.trim()) {
      toast.error("Please enter a valid API key.");
      return;
    }
    setApiKey(keyInput.trim());
    if (profile) {
      setProfile({ ...profile, gender });
    }
    setCurrentStep(1); // Move to magazine selection
    toast.success("Settings saved successfully!");
  };

  if (showInstructions) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        <Card className="border-gold/20 bg-obsidian/50 backdrop-blur-xl text-white">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gold/10 rounded-full">
                <Info className="w-8 h-8 text-gold" />
              </div>
            </div>
            <CardTitle className="text-2xl font-serif font-bold tracking-tighter uppercase italic text-gold-gradient">
              Accessing the Studio
            </CardTitle>
            <CardDescription className="text-gold/40 text-xs uppercase tracking-widest">
              Follow these steps to secure your elite access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gold/10 border border-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-xs font-bold text-gold">{step}</span>
                  </div>
                  <p className="text-sm text-gold/60">
                    {step === 1 && <>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline inline-flex items-center">Google AI Studio <ExternalLink className="w-3 h-3 ml-1" /></a>.</>}
                    {step === 2 && <>Click on the <span className="font-bold text-gold">"Create API key"</span> button.</>}
                    {step === 3 && <>Copy the generated key and paste it into the application.</>}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-5 bg-ruby/10 border border-ruby/30 rounded-xl space-y-3 shadow-inner shadow-ruby/5">
              <div className="flex items-center space-x-2 text-red-500">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-widest">Security Protocol</span>
              </div>
              <p className="text-[11px] leading-relaxed text-platinum/90">
                Your API key is stored <span className="font-bold text-red-400">locally in your browser</span>. We never see it on our servers. Note that using a free API key may involve data sharing with Google.
              </p>
            </div>

            <Button
              onClick={() => setShowInstructions(false)}
              variant="luxury"
              className="w-full h-12"
            >
              Return to Settings
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 lg:space-y-0 max-w-md lg:max-w-[500px] mx-auto w-full flex flex-col items-center justify-center min-h-0"
    >
      <Card className="border-gold/20 bg-obsidian/50 backdrop-blur-xl text-white overflow-hidden shadow-2xl shadow-gold/5 w-full flex flex-col min-h-0">
        <div className="flex-shrink-0 h-1 lg:h-1 bg-gold-gradient" />
        <CardHeader className="flex-shrink-0 space-y-1 lg:space-y-2 text-center pt-6 lg:pt-6">
          <CardTitle className="text-2xl lg:text-3xl font-serif font-bold tracking-tighter italic uppercase text-gold-gradient">
            Studio Settings
          </CardTitle>
          <CardDescription className="text-gold/40 text-[10px] lg:text-[10px] uppercase tracking-[0.2em] font-bold">
            Refine your elite experience
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto lg:overflow-visible space-y-6 lg:space-y-6 pb-6 lg:pb-6 px-6 lg:px-8 custom-scrollbar">
          <div className="flex flex-col space-y-6 lg:space-y-6">
            {/* API Key Section */}
            <div className="space-y-3 lg:space-y-3">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 lg:w-4 lg:h-4 text-gold/50" />
                <Label htmlFor="apiKey" className="text-[10px] lg:text-[10px] uppercase tracking-widest text-gold/50 font-bold">
                  Gemini AI Credentials
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="AIzaSy..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="bg-obsidian/50 border-gold/20 focus:ring-gold/50 h-12 lg:h-12 text-base lg:text-lg tracking-widest text-gold"
                />
                {keyInput.length > 10 && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-emerald" />
                  </div>
                )}
              </div>
              <Button
                variant="luxury-emerald"
                onClick={() => setShowInstructions(true)}
                className="w-full h-10 lg:h-10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
              >
                <Info className="w-4 h-4" />
                <span>Free API KEY</span>
              </Button>
            </div>

            {/* Gender Preference Section */}
            <div className="space-y-3 lg:space-y-3">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 lg:w-4 lg:h-4 text-gold/50" />
                <Label className="text-[10px] lg:text-[10px] uppercase tracking-widest text-gold/50 font-bold">
                  Aesthetic Preference
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:gap-3">
                <Button
                  type="button"
                  variant={gender === "female" ? "default" : "outline"}
                  className={`h-12 lg:h-12 text-[10px] lg:text-[10px] font-bold uppercase tracking-widest transition-all ${
                    gender === "female" ? "bg-gold text-obsidian shadow-lg" : "border-gold/10 text-gold/40 hover:text-gold hover:bg-gold/5"
                  }`}
                  onClick={() => setGender("female")}
                >
                  Female
                </Button>
                <Button
                  type="button"
                  variant={gender === "male" ? "default" : "outline"}
                  className={`h-12 lg:h-12 text-[10px] lg:text-[10px] font-bold uppercase tracking-widest transition-all ${
                    gender === "male" ? "bg-gold text-obsidian shadow-lg" : "border-gold/10 text-gold/40 hover:text-gold hover:bg-gold/5"
                  }`}
                  onClick={() => setGender("male")}
                >
                  Male
                </Button>
              </div>
              <div className="p-3 bg-gold/5 border border-gold/10 rounded-xl">
                <p className="text-[9px] lg:text-[10px] text-gold/40 leading-relaxed italic">
                  This setting helps our AI tailor the visual DNA and typography layout to your preferred aesthetic.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 lg:space-y-3 pt-4 lg:pt-4 border-t border-gold/10 flex-shrink-0">
            <Button
              onClick={handleSave}
              variant="luxury"
              className="w-full h-14 lg:h-16 text-lg lg:text-xl shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Save & Enter Studio
            </Button>
            {apiKey && (
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(1)}
                className="w-full text-gold/40 hover:text-gold hover:bg-gold/10 text-[10px] lg:text-[10px] uppercase tracking-widest font-bold h-9 lg:h-9"
              >
                Discard Changes
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex-shrink-0 flex items-center justify-center space-x-2 text-[9px] lg:text-[10px] text-gold/30 uppercase tracking-widest font-bold mt-4">
        <Info className="w-3 h-3 lg:w-3 lg:h-3" />
        <span>Encrypted local storage active</span>
      </div>
    </motion.div>
  );
}
