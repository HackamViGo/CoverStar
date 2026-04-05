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
  const [error, setError] = useState("");
  const router = useRouter();
  const setProfile = useAppStore((state) => state.setProfile);

  const validateEmail = (e: string) => {
    return String(e)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email and password are required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Invalid email format");
      toast.error("Invalid email format");
      return;
    }

    if (!password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid credentials");
        toast.error("Invalid credentials");
      } else {
        const profile = { email, name: email.split("@")[0], gender: "female" as const };
        const stored = localStorage.getItem("coverstar-profile");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.email === email) {
            profile.gender = parsed.gender;
          }
        }
        setProfile(profile);
        localStorage.setItem("coverstar-profile", JSON.stringify(profile));
        toast.success("Welcome back to the Studio");
        router.push("/");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
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
            <CardTitle className="text-4xl font-serif font-bold tracking-tighter italic text-gold-gradient">CoverStar</CardTitle>
            <CardDescription className="text-gold/50 text-xs uppercase tracking-[0.2em] font-medium">
              The Elite AI Magazine Studio
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit} noValidate>
            <CardContent className="space-y-6">
              {error && (
                <div className="p-3 bg-ruby/10 border border-ruby/20 rounded-xl text-center">
                  <p className="text-ruby text-[10px] uppercase tracking-widest font-bold">
                    {error}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gold/70 text-[10px] uppercase tracking-widest font-bold">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="excellence@luxury.com"
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
                New here?{" "}
                <Link href="/register" className="text-gold hover:underline font-bold">
                  Register for access
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
