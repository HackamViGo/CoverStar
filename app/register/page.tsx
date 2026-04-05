"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { motion } from "motion/react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState<"male" | "female">("female");
  const [agreements, setAgreements] = useState({
    terms: false,
    aiGenerated: false,
    entertainmentOnly: false,
    noAffiliation: false,
    userApiKey: false,
    privacy: false,
    noCommercial: false,
    notLiability: false,
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setProfile = useAppStore((state) => state.setProfile);

  const allAgreed = Object.values(agreements).every(Boolean);

  const handleMarkAllChange = () => {
    const newValue = !allAgreed;
    setAgreements({
      terms: newValue,
      aiGenerated: newValue,
      entertainmentOnly: newValue,
      noAffiliation: newValue,
      userApiKey: newValue,
      privacy: newValue,
      noCommercial: newValue,
      notLiability: newValue,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all agreements
    if (!allAgreed) {
      toast.error("Please agree to all terms and conditions to register.");
      return;
    }

    setLoading(false); // No real server, so it's fast

    const profile = { name, email, gender };
    
    // Save to localStorage to simulate a database
    localStorage.setItem("coverstar-profile", JSON.stringify(profile));
    setProfile(profile);

    toast.success("Account created successfully! Please login.");
    router.push("/login");
  };

  const handleAgreementChange = (key: keyof typeof agreements) => {
    setAgreements(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-black">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-gold/20 bg-obsidian/50 backdrop-blur-xl overflow-hidden">
          <CardHeader className="space-y-1 text-center pt-8">
            <CardTitle className="text-4xl font-serif font-bold tracking-tighter italic text-gold-gradient">Join the Elite</CardTitle>
            <CardDescription className="text-gold/50 text-xs uppercase tracking-[0.2em] font-medium">
              Begin your journey to the cover
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gold/70 text-[10px] uppercase tracking-widest font-bold">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Alexander Sterling"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-obsidian/50 border-gold/20 focus:ring-gold/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gold/70 text-[10px] uppercase tracking-widest font-bold">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="excellence@luxury.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-obsidian/50 border-gold/20 focus:ring-gold/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gold/70 text-[10px] uppercase tracking-widest font-bold">Secure Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-obsidian/50 border-gold/20 focus:ring-gold/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gold/70 text-[10px] uppercase tracking-widest font-bold">Gender Preference</Label>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant={gender === "female" ? "default" : "outline"}
                    className="flex-1 h-12"
                    onClick={() => setGender("female")}
                  >
                    Female
                  </Button>
                  <Button
                    type="button"
                    variant={gender === "male" ? "default" : "outline"}
                    className="flex-1 h-12"
                    onClick={() => setGender("male")}
                  >
                    Male
                  </Button>
                </div>
              </div>

              <div className="pt-4 space-y-3 border-t border-gold/10">
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreements.terms}
                    onChange={() => handleAgreementChange("terms")}
                    className="mt-1 h-4 w-4 rounded border-gold/30 bg-obsidian text-gold focus:ring-gold/50"
                    required
                  />
                  <Label htmlFor="terms" className="text-[10px] leading-tight cursor-pointer text-gold/60 uppercase tracking-tighter">
                    I agree to the Terms of Use
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="aiGenerated"
                    checked={agreements.aiGenerated}
                    onChange={() => handleAgreementChange("aiGenerated")}
                    className="mt-1 h-4 w-4 rounded border-gold/30 bg-obsidian text-gold focus:ring-gold/50"
                    required
                  />
                  <Label htmlFor="aiGenerated" className="text-[10px] leading-tight cursor-pointer text-gold/60 uppercase tracking-tighter">
                    I understand that all content is AI Generated
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="entertainmentOnly"
                    checked={agreements.entertainmentOnly}
                    onChange={() => handleAgreementChange("entertainmentOnly")}
                    className="mt-1 h-4 w-4 rounded border-gold/30 bg-obsidian text-gold focus:ring-gold/50"
                    required
                  />
                  <Label htmlFor="entertainmentOnly" className="text-[10px] leading-tight cursor-pointer text-gold/60 uppercase tracking-tighter">
                    This service is for Entertainment Only
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="noAffiliation"
                    checked={agreements.noAffiliation}
                    onChange={() => handleAgreementChange("noAffiliation")}
                    className="mt-1 h-4 w-4 rounded border-gold/30 bg-obsidian text-gold focus:ring-gold/50"
                    required
                  />
                  <Label htmlFor="noAffiliation" className="text-[10px] leading-tight cursor-pointer text-gold/60 uppercase tracking-tighter">
                    I acknowledge there is No Affiliation with real magazines
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="userApiKey"
                    checked={agreements.userApiKey}
                    onChange={() => handleAgreementChange("userApiKey")}
                    className="mt-1 h-4 w-4 rounded border-gold/30 bg-obsidian text-gold focus:ring-gold/50"
                    required
                  />
                  <Label htmlFor="userApiKey" className="text-[10px] leading-tight cursor-pointer text-gold/60 uppercase tracking-tighter">
                    I will provide my own Gemini API Key
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="privacy"
                    checked={agreements.privacy}
                    onChange={() => handleAgreementChange("privacy")}
                    className="mt-1 h-4 w-4 rounded border-gold/30 bg-obsidian text-gold focus:ring-gold/50"
                    required
                  />
                  <Label htmlFor="privacy" className="text-[10px] leading-tight cursor-pointer text-gold/60 uppercase tracking-tighter">
                    I agree to the Privacy Policy
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="noCommercial"
                    checked={agreements.noCommercial}
                    onChange={() => handleAgreementChange("noCommercial")}
                    className="mt-1 h-4 w-4 rounded border-gold/30 bg-obsidian text-gold focus:ring-gold/50"
                    required
                  />
                  <Label htmlFor="noCommercial" className="text-[10px] leading-tight cursor-pointer text-gold/60 uppercase tracking-tighter">
                    I agree to No Commercial Use of generated content
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="notLiability"
                    checked={agreements.notLiability}
                    onChange={() => handleAgreementChange("notLiability")}
                    className="mt-1 h-4 w-4 rounded border-gold/30 bg-obsidian text-gold focus:ring-gold/50"
                    required
                  />
                  <Label htmlFor="notLiability" className="text-[10px] leading-tight cursor-pointer text-gold/60 uppercase tracking-tighter">
                    I acknowledge that the service provider is Not Liable
                  </Label>
                </div>

                <div className="flex items-center space-x-2 pt-3 mt-2 border-t border-gold/20">
                  <input
                    type="checkbox"
                    id="markAll"
                    checked={allAgreed}
                    onChange={handleMarkAllChange}
                    className="h-5 w-5 rounded border-gold bg-obsidian text-gold focus:ring-gold"
                  />
                  <Label htmlFor="markAll" className="text-[12px] leading-none cursor-pointer text-gold font-bold uppercase tracking-widest underline decoration-gold/50 underline-offset-4">
                    Mark All Agreements
                  </Label>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pb-8">
              <Button type="submit" variant="luxury" className="w-full h-14" disabled={loading}>
                {loading ? "Processing..." : "Create Elite Account"}
              </Button>
              <p className="text-xs text-center text-gold/40">
                Already part of the circle?{" "}
                <Link href="/login" className="text-gold hover:underline font-bold">
                  Sign In
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
