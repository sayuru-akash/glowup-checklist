export type VibeKey = "soft-pop" | "clean-reset" | "main-character" | "study-core" | "power-mode";

export type FontKey = "nunito" | "outfit" | "jakarta" | "fraunces" | "caveat" | "patrick";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  picture?: string;
  authMode: "google" | "preview";
};

export type SetupAnswers = {
  vibe: VibeKey;
  ageRange: string;
  persona: string;
  visualIdentity: string;
  artStyle: string;
  currentFocus: string;
  schedule: string;
  energy: string;
  style: string;
  blockers: string;
  weeklyWin: string;
  intensity: "soft" | "balanced" | "ambitious";
};

export type GlowTask = {
  id: string;
  label: string;
  detail?: string;
  category: "hydration" | "skin" | "movement" | "food" | "mind" | "style" | "study" | "sleep" | "social";
  completed: boolean;
};

export type GlowDay = {
  id: string;
  label: string;
  focus: string;
  affirmation: string;
  tasks: GlowTask[];
};

export type ThemeSpec = {
  name: string;
  vibe: VibeKey;
  palette: {
    background: string;
    surface: string;
    surfaceStrong: string;
    ink: string;
    muted: string;
    accent: string;
    accentStrong: string;
    highlight: string;
    border: string;
  };
  fonts: {
    display: FontKey;
    body: FontKey;
    handwriting: FontKey;
  };
  motifs: string[];
  iconStyle: "rounded" | "spark" | "sharp" | "soft";
};

export type WeeklyPlan = {
  theme: ThemeSpec;
  title: string;
  subtitle: string;
  note: string;
  weeklyMantra: string;
  days: GlowDay[];
  imagePrompt: string;
  backgroundPrompt: string;
};

export type StoredAppState = {
  profile: UserProfile;
  answers?: SetupAnswers;
  setupStep?: number;
  plan?: WeeklyPlan;
  activeDayId?: string;
  generatedImage?: string;
  generatedBackgroundImage?: string;
  planSource?: "ai";
  imageSource?: "ai";
  backgroundImageSource?: "ai";
  generationError?: string;
  imageError?: string;
  backgroundImageError?: string;
  generatedAt?: string;
};
