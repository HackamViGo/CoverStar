"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  Trash2, 
  Download, 
  Share2,
  Image as ImageIcon,
  X
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { MAGAZINES } from "@/lib/magazines";
import { MagazineTitle } from "@/components/MagazineTitle";
import { ShareModal } from "@/components/ShareModal";
import { Magazine3DCard } from "@/components/Magazine3DCard";

export default function GalleryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { gallery, removeCover, setCurrentStep } = useAppStore();
  const [selectedCover, setSelectedCover] = useState<any | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const handleDelete = (id: string) => {
    if (navigator.vibrate) navigator.vibrate(50);
    removeCover(id);
    toast.success("Cover removed from gallery");
  };

  const handleDownload = (imageUrl: string, magazineName: string) => {
    if (navigator.vibrate) navigator.vibrate(50);
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `CoverStar-${magazineName}-${Date.now()}.png`;
    link.click();
  };

  const handleDownloadAll = async () => {
    if (gallery.length === 0) return;
    if (navigator.vibrate) navigator.vibrate(50);
    
    toast.info(`Starting download of ${gallery.length} covers...`);
    
    for (let i = 0; i < gallery.length; i++) {
      const cover = gallery[i];
      handleDownload(cover.imageUrl, cover.magazineName);
      // Small delay to prevent browser from blocking multiple downloads
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    toast.success("All covers downloaded successfully");
  };

  const handleShare = (cover: any) => {
    if (navigator.vibrate) navigator.vibrate(50);
    setShareTarget(cover);
    setIsShareModalOpen(true);
  };

  const openFullscreen = (cover: any) => {
    if (navigator.vibrate) navigator.vibrate(50);
    setSelectedCover(cover);
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="lg:max-w-none lg:h-[100dvh] lg:overflow-hidden mx-auto min-h-screen flex flex-col bg-obsidian text-white pb-20 lg:pb-0 selection:bg-gold/30">
      {/* Header */}
      <header className="flex-shrink-0 p-6 lg:p-4 flex items-center space-x-4 lg:space-x-8 border-b border-gold/10 sticky top-0 bg-obsidian/80 backdrop-blur-xl z-20 max-w-[1440px] mx-auto w-full h-auto lg:h-[80px]">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.push("/")}
          className="text-gold/50 hover:text-gold hover:bg-gold/10 w-10 h-10 lg:w-12 lg:h-12"
        >
          <ArrowLeft className="w-5 h-5 lg:w-6 lg:h-6" />
        </Button>
        <div 
          className="flex flex-col cursor-pointer group"
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(50);
            setCurrentStep(1);
            router.push("/");
          }}
        >
          <h1 className="text-xl lg:text-3xl font-serif font-bold tracking-tighter italic text-gold-gradient leading-none group-hover:scale-105 transition-transform duration-500">
            Your Gallery
          </h1>
          <span className="text-[8px] lg:text-[10px] uppercase tracking-[0.4em] text-gold/40 font-bold mt-1 lg:mt-2">
            Elite Collection
          </span>
        </div>

        {gallery.length > 0 && (
          <div className="flex-1 flex justify-end pr-2 lg:pr-6">
            <Button
              onClick={handleDownloadAll}
              variant="luxury"
              className="h-8 lg:h-12 px-4 lg:px-8 text-[9px] lg:text-xs uppercase tracking-widest font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              <Download className="w-3 h-3 lg:w-4 lg:h-4 mr-2" />
              Download All
            </Button>
          </div>
        )}
      </header>

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto lg:overflow-hidden min-h-0 custom-scrollbar max-w-[1440px] mx-auto w-full flex flex-col">
        {gallery.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 lg:space-y-8">
            <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gold/5 rounded-full flex items-center justify-center border border-gold/10">
              <ImageIcon className="w-10 h-10 lg:w-12 lg:h-12 text-gold/20" />
            </div>
            <div className="space-y-2 lg:space-y-2">
              <p className="text-2xl lg:text-4xl font-serif font-bold italic text-gold/40">The gallery is empty</p>
              <p className="text-[10px] lg:text-[10px] uppercase tracking-widest text-gold/20 font-bold">Begin your creative journey today</p>
            </div>
            <Button 
              onClick={() => router.push("/")}
              variant="luxury"
              className="px-8 lg:px-12 lg:h-16 lg:text-lg"
            >
              Enter Studio
            </Button>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto pr-2 lg:pr-4 custom-scrollbar">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
              <AnimatePresence>
                {gallery.map((cover) => (
                  <motion.div
                    key={cover.id}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    whileHover={{ y: -4 }}
                    className="group relative aspect-[2/3] rounded-2xl lg:rounded-2xl overflow-hidden bg-gold/5 border border-gold/10 cursor-pointer shadow-xl hover:shadow-[0_0_40px_rgba(212,175,55,0.2)] transition-all duration-500"
                    onClick={() => openFullscreen(cover)}
                  >
                    <Image
                      src={cover.imageUrl}
                      alt={cover.magazineName}
                      fill
                      className="object-cover transition-transform duration-1000 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-obsidian/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center space-y-4 lg:space-y-4 p-4 backdrop-blur-sm">
                      {(() => {
                        const mag = MAGAZINES.find(m => m.name === cover.magazineName);
                        if (!mag) return <p className="text-xs lg:text-lg font-serif font-bold italic text-gold text-center">{cover.magazineName}</p>;
                        
                        if (mag.id === "time") {
                          return (
                            <span
                              className="px-2 py-0.5 bg-red-600 text-white text-xs lg:text-lg tracking-widest drop-shadow-lg"
                              style={{ fontFamily: mag.uiFont, fontWeight: mag.uiFontWeight }}
                            >
                              {mag.name}
                            </span>
                          );
                        }
                        
                        return (
                          <MagazineTitle 
                            magazine={mag} 
                            className="text-xs lg:text-lg text-gold text-center" 
                          />
                        );
                      })()}
                      <div className="flex space-x-3 lg:space-x-3">
                        <Button 
                          size="icon" 
                          variant="secondary" 
                          className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gold text-obsidian hover:bg-gold-light shadow-lg transition-transform hover:scale-110"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(cover);
                          }}
                        >
                          <Share2 className="w-5 h-5 lg:w-6 lg:h-6" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="secondary" 
                          className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gold text-obsidian hover:bg-gold-light shadow-lg transition-transform hover:scale-110"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(cover.imageUrl, cover.magazineName);
                          }}
                        >
                          <Download className="w-5 h-5 lg:w-6 lg:h-6" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="destructive" 
                          className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-ruby text-white hover:bg-ruby/80 shadow-lg transition-transform hover:scale-110"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(cover.id);
                          }}
                        >
                          <Trash2 className="w-5 h-5 lg:w-6 lg:h-6" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {selectedCover && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-obsidian/95 backdrop-blur-2xl flex items-center justify-center p-6 lg:p-12"
            onClick={() => setSelectedCover(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            className="relative w-full max-w-[85vw] sm:max-w-[70vw] lg:max-w-lg aspect-[2/3] rounded-3xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <Magazine3DCard imageUrl={selectedCover.imageUrl} animation="shimmer" />
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 lg:top-6 lg:right-6 bg-obsidian/50 hover:bg-obsidian/70 text-gold rounded-full backdrop-blur-md border border-gold/20 w-10 h-10 lg:w-14 lg:h-14 z-50"
                onClick={() => setSelectedCover(null)}
              >
                <X className="w-6 h-6 lg:w-8 lg:h-8" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        imageUrl={shareTarget?.imageUrl || ""}
        magazineName={shareTarget?.magazineName || ""}
      />

      {/* Footer Branding */}
      <footer className="flex-shrink-0 p-4 lg:p-2 text-center border-t border-gold/5 h-auto lg:h-[40px] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-1">
          <div className="hidden lg:block w-8 h-px bg-gold/20" />
          <p className="text-[8px] lg:text-[10px] text-gold/20 uppercase tracking-[0.4em] font-bold">
            Powered by Gemini AI • Elite Studio
          </p>
        </div>
      </footer>
    </div>
  );
}
