import type { CSSProperties } from "react";
import type { FontKey, ThemeSpec, VibeKey } from "@/lib/types";

type Preset = Omit<ThemeSpec, "name"> & { label: string; promptStyle: string };

export const fontClassMap: Record<FontKey, string> = {
  nunito: "font-nunito",
  outfit: "font-outfit",
  jakarta: "font-jakarta",
  fraunces: "font-fraunces",
  caveat: "font-caveat",
  patrick: "font-patrick"
};

export const vibePresets: Record<VibeKey, Preset> = {
  "soft-pop": {
    label: "Soft Pop Glow",
    vibe: "soft-pop",
    promptStyle:
      "pastel lilac, dreamy sticker scrapbook, glossy hearts, hand-drawn checklist, soft room glow, playful but readable",
    palette: {
      background: "#f4e9ff",
      surface: "#fff8ff",
      surfaceStrong: "#efe0ff",
      ink: "#26194a",
      muted: "#76629b",
      accent: "#9c6cff",
      accentStrong: "#6f39d8",
      highlight: "#ffd9f2",
      border: "#d9c5f6"
    },
    fonts: { display: "fraunces", body: "nunito", handwriting: "caveat" },
    motifs: ["sparkles", "hearts", "stickers", "polaroids"],
    iconStyle: "soft"
  },
  "clean-reset": {
    label: "Clean Reset",
    vibe: "clean-reset",
    promptStyle:
      "fresh morning light, glassy mint and coral, editorial wellness planner, clean icons, airy routine board",
    palette: {
      background: "#eefaf4",
      surface: "#ffffff",
      surfaceStrong: "#dff5ed",
      ink: "#17352d",
      muted: "#607a72",
      accent: "#ff7868",
      accentStrong: "#df4d3d",
      highlight: "#d6fff1",
      border: "#bde7db"
    },
    fonts: { display: "outfit", body: "jakarta", handwriting: "patrick" },
    motifs: ["dew", "leaves", "glass", "fresh tabs"],
    iconStyle: "rounded"
  },
  "main-character": {
    label: "Main Character",
    vibe: "main-character",
    promptStyle:
      "warm city night, chrome pink highlights, magazine collage, confident character energy, cinematic habit planner",
    palette: {
      background: "#fff1ee",
      surface: "#ffffff",
      surfaceStrong: "#ffe1db",
      ink: "#321a22",
      muted: "#8c6370",
      accent: "#ff4f8b",
      accentStrong: "#d71665",
      highlight: "#ffe96f",
      border: "#f6b8c9"
    },
    fonts: { display: "fraunces", body: "outfit", handwriting: "caveat" },
    motifs: ["camera flash", "stars", "lip gloss", "tickets"],
    iconStyle: "spark"
  },
  "study-core": {
    label: "Study Core",
    vibe: "study-core",
    promptStyle:
      "cozy desk setup, lavender blue stationery, neat timetable, academic planner, soft lamp light, clear checklist",
    palette: {
      background: "#eef2ff",
      surface: "#ffffff",
      surfaceStrong: "#dfe6ff",
      ink: "#19224a",
      muted: "#66709a",
      accent: "#5771ff",
      accentStrong: "#2d46cc",
      highlight: "#ffe7a7",
      border: "#c8d2ff"
    },
    fonts: { display: "outfit", body: "nunito", handwriting: "patrick" },
    motifs: ["notebooks", "tabs", "highlighter", "moon"],
    iconStyle: "sharp"
  },
  "power-mode": {
    label: "Power Mode",
    vibe: "power-mode",
    promptStyle:
      "electric lime and black workout-board energy, clean productive dashboard, bold typography, fast habit streaks",
    palette: {
      background: "#f1ffd8",
      surface: "#ffffff",
      surfaceStrong: "#dfff8d",
      ink: "#111909",
      muted: "#59634a",
      accent: "#9be72f",
      accentStrong: "#4d8700",
      highlight: "#b8f7ff",
      border: "#c4e884"
    },
    fonts: { display: "outfit", body: "jakarta", handwriting: "caveat" },
    motifs: ["bolts", "progress rings", "sneakers", "clean grids"],
    iconStyle: "rounded"
  }
};

export function buildThemeFromVibe(vibe: VibeKey, name?: string): ThemeSpec {
  const preset = vibePresets[vibe] ?? vibePresets["soft-pop"];
  return {
    name: name ?? preset.label,
    vibe: preset.vibe,
    palette: preset.palette,
    fonts: preset.fonts,
    motifs: preset.motifs,
    iconStyle: preset.iconStyle
  };
}

export function themeStyle(theme: ThemeSpec) {
  return {
    "--bg": theme.palette.background,
    "--surface": theme.palette.surface,
    "--surface-strong": theme.palette.surfaceStrong,
    "--ink": theme.palette.ink,
    "--muted": theme.palette.muted,
    "--accent": theme.palette.accent,
    "--accent-strong": theme.palette.accentStrong,
    "--highlight": theme.palette.highlight,
    "--border": theme.palette.border
  } as CSSProperties;
}

export function promptStyleForVibe(vibe: VibeKey) {
  return vibePresets[vibe]?.promptStyle ?? vibePresets["soft-pop"].promptStyle;
}
