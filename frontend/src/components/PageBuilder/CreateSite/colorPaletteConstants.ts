export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

export interface PaletteOption {
  id: string;
  colors: ColorScheme;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  palettes: PaletteOption[];
}

export const colorCategories: Category[] = [
  {
    id: "friendly",
    name: "Friendly",
    description: "Warm, approachable, lively colors",
    palettes: [
      {
        id: "friendly-1",
        colors: {
          primary: "#FF8566",
          secondary: "#FFD666",
          accent: "#B8E986",
          background: "#FFFEF9",
        },
      },
      {
        id: "friendly-2",
        colors: {
          primary: "#7CB8A6",
          secondary: "#FF9F7F",
          accent: "#FFD4BA",
          background: "#FFF8F5",
        },
      },
      {
        id: "friendly-3",
        colors: {
          primary: "#FFB5C2",
          secondary: "#B8A5D6",
          accent: "#E8DEF8",
          background: "#FAFAFA",
        },
      },
    ],
  },
  {
    id: "bold",
    name: "Bold",
    description: "High-contrast, strong, energetic colors",
    palettes: [
      {
        id: "bold-1",
        colors: {
          primary: "#FF0066",
          secondary: "#0A0A0A",
          accent: "#00E5FF",
          background: "#FFFFFF",
        },
      },
      {
        id: "bold-2",
        colors: {
          primary: "#FF6B35",
          secondary: "#1A0F0A",
          accent: "#FFB627",
          background: "#FFFFFF",
        },
      },
      {
        id: "bold-3",
        colors: {
          primary: "#00C2FF",
          secondary: "#111111",
          accent: "#FFB800",
          background: "#F5F7FA",
        },
      },
    ],
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Soft, clean, modern neutrals",
    palettes: [
      {
        id: "minimal-1",
        colors: {
          primary: "#1F1F1F",
          secondary: "#171717",
          accent: "#C6C6C6",
          background: "#EFEFEF",
        },
      },
      {
        id: "minimal-2",
        colors: {
          primary: "#2C3E4F",
          secondary: "#556B7C",
          accent: "#8FA5B3",
          background: "#F8FAFB",
        },
      },
      {
        id: "minimal-3",
        colors: {
          primary: "#3D3631",
          secondary: "#9B8B7E",
          accent: "#C4B5A0",
          background: "#FAF8F5",
        },
      },
    ],
  },
  {
    id: "luxury",
    name: "Luxury",
    description: "Rich, elegant, premium tones",
    palettes: [
      {
        id: "luxury-1",
        colors: {
          primary: "#C9A227",
          secondary: "#0F172A",
          accent: "#475569",
          background: "#FAF9F6",
        },
      },
      {
        id: "luxury-2",
        colors: {
          primary: "#2D6A4F",
          secondary: "#0F2922",
          accent: "#B8860B",
          background: "#F8FAF9",
        },
      },
      {
        id: "luxury-3",
        colors: {
          primary: "#6B21A8",
          secondary: "#1E1B4B",
          accent: "#C9A227",
          background: "#FAF7FF",
        },
      },
    ],
  },
];

/**
 * Get the category ID for a given palette ID
 */
export const getCategoryFromPaletteId = (paletteId: string): string | null => {
  for (const category of colorCategories) {
    if (category.palettes.some(p => p.id === paletteId)) {
      return category.id;
    }
  }
  return null;
};

/**
 * Map category ID to font family
 */
export const getFontFamilyFromCategory = (categoryId: string | null): string => {
  const fontMap: Record<string, string> = {
    friendly: '"Londrina Solid", sans-serif',
    luxury: '"Limelight", sans-serif',
    minimal: '"Public Sans", sans-serif',
    bold: '"Oswald", sans-serif',
  };
  
  return categoryId ? (fontMap[categoryId] || '"General Sans", sans-serif') : '"General Sans", sans-serif';
};

/**
 * Get font family from palette ID
 */
export const getFontFamilyFromPalette = (paletteId: string): string => {
  const categoryId = getCategoryFromPaletteId(paletteId);
  return getFontFamilyFromCategory(categoryId);
};
