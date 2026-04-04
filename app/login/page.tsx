"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { motion } from "motion/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGenderSelection, setShowGenderSelection] = useState(false);
  const [tempProfile, setTempProfile] = useState<any>(null);
  const router = useRouter();
  const setProfile = useAppStore((state) => state.setProfile);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid credentials");
      } else {
        // In a real app, we'd fetch the profile from the server
        // For this demo, we'll check if a profile exists in localStorage
        const storedProfile = localStorage.getItem("coverstar-profile");
        let profile = { email, name: email.split("@")[0], gender: "female" as const };
        
        if (storedProfile) {
          const parsed = JSON.parse(storedProfile);
          if (parsed.email === email) {
            profile = parsed;
          }
        }
        
        setTempProfile(profile);
        setShowGenderSelection(true);
        toast.success("Logged in successfully. Please select your gender.");
      }
    } catch (error) {
      toast.error("An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const handleGenderSelect = (gender: "male" | "female") => {
    const updatedProfile = { ...tempProfile, gender };
    localStorage.setItem("coverstar-profile", JSON.stringify(updatedProfile));
    setProfile(updatedProfile);
    toast.success(`Gender set to ${gender}`);
    window.location.href = "/";
  };

  if (showGenderSelection) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-black">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="border-zinc-800 bg-zinc-950 text-white">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-3xl font-bold tracking-tighter">Select Gender</CardTitle>
              <CardDescription className="text-zinc-400">
                Choose your preference for magazine covers
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-32 flex flex-col items-center justify-center space-y-2 border-zinc-800 hover:bg-zinc-900"
                onClick={() => handleGenderSelect("female")}
              >
                <span className="text-4xl">👩</span>
                <span>Female</span>
              </Button>
              <Button
                variant="outline"
                className="h-32 flex flex-col items-center justify-center space-y-2 border-zinc-800 hover:bg-zinc-900"
                onClick={() => handleGenderSelect("male")}
              >
                <span className="text-4xl">👨</span>
                <span>Male</span>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-black">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-gold/20 bg-obsidian/50 backdrop-blur-xl overflow-hidden">
          <CardHeader className="space-y-1 text-center pt-8">
            <CardTitle className="text-4xl font-serif font-bold tracking-tighter italic text-gold-gradient">CoverStar</CardTitle>
            <CardDescription className="text-gold/50 text-xs uppercase tracking-[0.2em] font-medium">
              The Elite AI Magazine Studio
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
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
                <Label htmlFor="password" className="text-gold/70 text-[10px] uppercase tracking-widest font-bold">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-obsidian/50 border-gold/20 focus:ring-gold/50"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-6 pb-8">
              <Button type="submit" variant="luxury" className="w-full h-14" disabled={loading}>
                {loading ? "Authenticating..." : "Sign In to Studio"}
              </Button>
              <p className="text-xs text-center text-gold/40">
                New to the elite circle?{" "}
                <Link href="/register" className="text-gold hover:underline font-bold">
                  Request Access
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
