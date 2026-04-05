'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Cover {
  id: string;
  imageUrl: string;
  title: string;
  createdAt: string;
}

interface CoverStore {
  covers: Cover[];
  addCover: (cover: Cover) => void;
  deleteCover: (id: string) => void;
  clearAllCovers: () => void;
}

export const useCoverStore = create<CoverStore>()(
  persist(
    (set) => ({
      covers: [],
      addCover: (cover) =>
        set((state) => ({ covers: [cover, ...state.covers] })),
      deleteCover: (id) =>
        set((state) => ({
          covers: state.covers.filter((c) => c.id !== id),
        })),
      clearAllCovers: () => set({ covers: [] }),
    }),
    {
      name: 'coverstar-covers-v1',
    }
  )
);
