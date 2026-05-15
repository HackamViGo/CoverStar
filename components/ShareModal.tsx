"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, Copy, Check, Twitter, Facebook, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  magazineName: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, imageUrl, magazineName }) => {
  const [message, setMessage] = useState(`Check out my custom ${magazineName} cover created with CoverStar AI! #CoverStar #EliteStudio`);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${message}\n\n${imageUrl}`);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const handleShare = async (platform?: string) => {
    const shareUrl = window.location.href;
    const fullText = `${message}\n\n${shareUrl}`;

    if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(fullText)}`, "_blank");
      return;
    }

    if (platform === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `My ${magazineName} Cover`,
          text: message,
          url: shareUrl,
        });
        toast.success("Shared successfully!");
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          toast.error("Sharing failed");
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-obsidian/90 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-obsidian border border-gold/20 rounded-3xl p-6 lg:p-8 shadow-[0_0_50px_rgba(212,175,55,0.2)] space-y-6"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-gold/40 hover:text-gold transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center space-y-2">
              <h3 className="text-2xl font-serif font-bold italic text-gold-gradient">Share Masterpiece</h3>
              <p className="text-[10px] text-gold/40 uppercase tracking-widest font-bold">Personalize your announcement</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-gold/60 font-bold">Custom Message</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write something about your cover..."
                  className="bg-gold/5 border-gold/10 focus:border-gold/30 text-gold min-h-[100px] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleShare("twitter")}
                  className="border-gold/10 hover:border-gold/30 bg-gold/5 text-gold/60 hover:text-gold space-x-2"
                >
                  <Twitter className="w-4 h-4" />
                  <span className="text-[10px] uppercase tracking-widest font-bold">Twitter</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleShare("facebook")}
                  className="border-gold/10 hover:border-gold/30 bg-gold/5 text-gold/60 hover:text-gold space-x-2"
                >
                  <Facebook className="w-4 h-4" />
                  <span className="text-[10px] uppercase tracking-widest font-bold">Facebook</span>
                </Button>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => handleShare()}
                  variant="luxury"
                  className="flex-1 h-12"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Share Now
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  className="w-12 h-12 p-0 border-gold/10 hover:border-gold/30 bg-gold/5 text-gold/60 hover:text-gold"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>
            </div>

            <p className="text-[8px] text-center text-gold/20 uppercase tracking-widest leading-relaxed">
              Tip: Tag your friends to show them their future competition
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
