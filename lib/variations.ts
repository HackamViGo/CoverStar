import { Magazine, MAGAZINES } from "./magazines";

export interface Variation {
  id: string;
  title: string;
  magazineId: string;
  magazineName: string;
  description: string;
  headline: string;
  thumbnail: string;
  promptOverride: string;
}

export const LOCAL_LEGENDS: Variation[] = [
  {
    id: "banitsa-queen",
    title: "The Banitsa Queen",
    magazineId: "vogue",
    magazineName: "Vogue Bulgaria",
    description: "Modern high-fashion attire, holding a tray with a perfect traditional Bulgarian banitsa pastry.",
    headline: "The Secret Ingredient: Butter & Elegance",
    thumbnail: "/variations/banitsa-queen.jpg",
    promptOverride: "The subject is wearing modern high-fashion attire but is holding a tray with a perfect, golden-brown traditional Bulgarian banitsa pastry. The setting is an elegant, high-end kitchen or a minimalist studio. The vibe is Vogue Bulgaria: sophisticated, cultural, and artistic."
  },
  {
    id: "silicon-valley-pioneer",
    title: "The Silicon Valley Pioneer",
    magazineId: "forbes",
    magazineName: "Forbes Tech",
    description: "Hoodie, glasses, messy desk, and 'Matrix' code in the background.",
    headline: "Disrupting the Matrix",
    thumbnail: "/variations/silicon-valley.jpg",
    promptOverride: "The subject is wearing a hoodie and glasses, sitting at a messy desk with multiple monitors. The background features glowing green 'Matrix' style digital code. The vibe is Forbes Tech: innovative, disruptive, and intellectual."
  },
  {
    id: "nonna-masterclass",
    title: "The Nonna Masterclass",
    magazineId: "elle",
    magazineName: "Elle Cooking",
    description: "Cooking apron, covered in flour, but with a supermodel gaze.",
    headline: "Pasta, Love & No Carbs",
    thumbnail: "/variations/nonna.jpg",
    promptOverride: "The subject is wearing a stylish cooking apron and is covered in a light dusting of flour, but maintains a fierce supermodel gaze. The setting is a rustic but chic Italian kitchen. The vibe is Elle Cooking: energetic, stylish, and vibrant."
  },
  {
    id: "digital-nomad",
    title: "The Digital Nomad",
    magazineId: "natgeo", // Virtual ID if not exists
    magazineName: "National Geographic",
    description: "With a laptop on a hammock between two palm trees.",
    headline: "Office with a View: Remote is the New Black",
    thumbnail: "/variations/digital-nomad.jpg",
    promptOverride: "The subject is working on a laptop while relaxing in a hammock strung between two palm trees on a tropical beach. The vibe is National Geographic: adventurous, global, and visually stunning."
  },
  {
    id: "urban-legend",
    title: "The Urban Legend",
    magazineId: "rolling-stone",
    magazineName: "Rolling Stone",
    description: "Leather jacket, graffiti background, headphones.",
    headline: "The Sound of the Concrete Jungle",
    thumbnail: "/variations/urban-legend.jpg",
    promptOverride: "The subject is wearing a leather jacket and headphones, standing in front of a vibrant graffiti-covered wall in an urban alley. The vibe is Rolling Stone: rebellious, edgy, and cool."
  },
  {
    id: "zen-architect",
    title: "The Zen Architect",
    magazineId: "monocle", // Virtual ID
    magazineName: "Monocle",
    description: "Minimalist black turtleneck, cup of tea, concrete wall.",
    headline: "Less is Everything",
    thumbnail: "/variations/zen-architect.jpg",
    promptOverride: "The subject is wearing a minimalist black turtleneck, holding a simple ceramic cup of tea, standing against a raw concrete wall. The vibe is Monocle: minimalist, sophisticated, and architectural."
  },
  {
    id: "crypto-whale",
    title: "The Crypto Whale",
    magazineId: "wsj", // Virtual ID
    magazineName: "Wall Street Journal",
    description: "Suit, but with neon elements and Bitcoin graphics in the eyes.",
    headline: "To the Moon and Back",
    thumbnail: "/variations/crypto-whale.jpg",
    promptOverride: "The subject is wearing a sharp business suit, but with subtle neon glowing elements. Their eyes have a faint reflection of Bitcoin symbols or digital tickers. The vibe is Wall Street Journal: prestigious, powerful, and tech-forward."
  },
  {
    id: "olympic-hopeful",
    title: "The Olympic Hopeful",
    magazineId: "sports-illustrated",
    magazineName: "Sports Illustrated",
    description: "Athletic wear, dynamic 'in motion' pose, sweat and determination.",
    headline: "Faster, Stronger, AI-er",
    thumbnail: "/variations/olympic-hopeful.jpg",
    promptOverride: "The subject is in athletic wear, captured in a dynamic 'in motion' pose (like sprinting or jumping). There is visible sweat and a look of intense determination. The vibe is Sports Illustrated: epic, energetic, and dramatic."
  },
  {
    id: "gothic-aristocrat",
    title: "The Gothic Aristocrat",
    magazineId: "harpers-bazaar",
    magazineName: "Bazaar",
    description: "Lace, candles, dark lipstick, and Victorian aesthetics.",
    headline: "The Beauty in the Shadows",
    thumbnail: "/variations/gothic-aristocrat.jpg",
    promptOverride: "The subject is wearing intricate black lace, with dark lipstick, surrounded by glowing candles in a Victorian-style room. The vibe is Harper's Bazaar: artistic, museum-like, and sophisticated."
  },
  {
    id: "street-style-icon",
    title: "The Street Style Icon",
    magazineId: "gq",
    magazineName: "GQ",
    description: "Latest sneakers, oversized jacket, shot from a low angle on the street.",
    headline: "Hypebeast of the Year",
    thumbnail: "/variations/street-style.jpg",
    promptOverride: "The subject is wearing the latest hypebeast sneakers and an oversized designer jacket, shot from a low angle on a busy city street. The vibe is GQ: sophisticated, cool, and sharp."
  }
];
