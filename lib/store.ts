import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserProfile {
  name: string;
  email: string;
  gender: "male" | "female";
}

interface Cover {
  id: string;
  imageUrl: string;
  magazineName: string;
  createdAt: string;
}

interface AppState {
  profile: UserProfile | null;
  gallery: Cover[];
  apiKey: string | null;
  currentStep: number;
  setProfile: (profile: UserProfile) => void;
  setApiKey: (key: string | null) => void;
  setCurrentStep: (step: number) => void;
  setGallery: (gallery: Cover[]) => void;
  addCover: (cover: Cover) => void;
  removeCover: (id: string) => void;
  clearProfile: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      profile: null,
      gallery: [],
      apiKey: null,
      currentStep: 0,
      setProfile: (profile) => set({ profile }),
      setApiKey: (apiKey) => set({ apiKey }),
      setCurrentStep: (currentStep) => set({ currentStep }),
      setGallery: (gallery) => set({ gallery }),
      addCover: (cover) =>
        set((state) => ({ gallery: [cover, ...state.gallery] })),
      removeCover: (id) =>
        set((state) => ({
          gallery: state.gallery.filter((c) => c.id !== id),
        })),
      clearProfile: () => set({ profile: null, apiKey: null, currentStep: 0 }),
    }),
    {
      name: "coverstar-storage-v3",
      partialize: (state) => ({ profile: state.profile, apiKey: state.apiKey }),
    }
  )
);
