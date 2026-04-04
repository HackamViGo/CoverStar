// lib/generation-pools.ts

/**
 * UTILITY POOLS — shared across all magazines.
 * Magazine-specific content (headlines, sublines, clothing, poses) 
 * is now in each Magazine's DNA in magazines.ts
 */

// Camera angles — universal photography parameter
export const ANGLE_POOL = [
  "Low angle, looking up at the subject — monumental and heroic feel",
  "Eye-level shot — direct, personal connection with the viewer", 
  "Slightly high angle — soft and approachable",
  "Medium shot from waist up — balanced and professional",
  "Extreme close-up filling the frame with expression and detail"
];

// Background mood modifiers — combined with magazine's backgroundGuide
export const MOOD_POOL = [
  "warm and inviting atmosphere",
  "cool and sophisticated atmosphere",
  "dramatic and intense atmosphere",
  "bright and energetic atmosphere",
  "intimate and personal atmosphere"
];

// Seasonal style modifier
export const SEASON_POOL = [
  "Spring/Summer collection feel — light fabrics, fresh energy",
  "Fall/Winter collection feel — rich textures, warm layers",
  "Resort/Cruise collection feel — luxurious relaxation",
  "Transitional season — versatile, layered styling"
];

// Utility: get random item from array
export function getRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Utility: get N random unique items from array
export function getRandomN<T>(array: T[], n: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(n, shuffled.length));
}
