import { buildThemeFromVibe, promptStyleForVibe } from "@/lib/theme";
import type { GlowTask, SetupAnswers, WeeklyPlan } from "@/lib/types";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const categoryTasks: Array<Omit<GlowTask, "id" | "completed">> = [
  { label: "Drink water before your first scroll", detail: "Keep a bottle visible.", category: "hydration", minutes: 2 },
  { label: "Two-step skincare reset", detail: "Cleanse and moisturize. SPF in the morning.", category: "skin", minutes: 8 },
  { label: "Move your body for one playlist", detail: "Walk, stretch, dance, or train.", category: "movement", minutes: 15 },
  { label: "Add one real-food upgrade", detail: "Protein, fruit, greens, or a proper meal.", category: "food", minutes: 10 },
  { label: "Catch one negative thought", detail: "Rewrite it like you are on your own team.", category: "mind", minutes: 4 },
  { label: "Outfit check before leaving", detail: "Clean, comfortable, intentional.", category: "style", minutes: 5 },
  { label: "One focused work sprint", detail: "Phone away, timer on, tiny finish line.", category: "study", minutes: 25 },
  { label: "Sleep wind-down cue", detail: "Dim lights and close the loop.", category: "sleep", minutes: 10 }
];

function rotateTasks(dayIndex: number, intensity: SetupAnswers["intensity"]) {
  const count = intensity === "ambitious" ? 7 : intensity === "soft" ? 5 : 6;
  return Array.from({ length: count }, (_, index) => {
    const task = categoryTasks[(dayIndex + index) % categoryTasks.length];
    return {
      ...task,
      id: `${dayIndex}-${index}-${task.category}`,
      completed: false
    };
  });
}

export function fallbackPlan(answers: SetupAnswers): WeeklyPlan {
  const theme = buildThemeFromVibe(answers.vibe);
  const weeklyWin = answers.weeklyWin || "feel lighter, cleaner, and more consistent";
  const focus = conciseFocus(answers.currentFocus || "daily basics");

  return {
    theme,
    title: `${theme.name} Weekly Glow-Up`,
    subtitle: "small steps, every day, real transformation",
    note: `${answers.schedule || "Busy schedule"} - still doing the basics.`,
    weeklyMantra: buildMantra(weeklyWin),
    days: days.map((label, dayIndex) => ({
      id: label.toLowerCase(),
      label,
      focus: dayIndex % 2 === 0 ? focus : "protect your energy",
      affirmation: ["I can keep this simple.", "Consistency counts.", "My basics are powerful.", "I can reset fast."][dayIndex % 4],
      tasks: rotateTasks(dayIndex, answers.intensity)
    })),
    imagePrompt: buildImagePrompt(answers),
    backgroundPrompt: buildBackgroundPrompt(answers)
  };
}

function conciseFocus(value: string) {
  const cleaned = value.split(/[,.]/)[0]?.trim() || "daily basics";
  const words = cleaned.split(/\s+/).filter(Boolean);
  return words.slice(0, 5).join(" ");
}

function buildMantra(value: string) {
  const cleaned = value.trim().replace(/[.]+$/, "");
  if (!cleaned) return "Small basics count, and I can keep showing up.";
  if (/^i\s/i.test(cleaned)) return `${cleaned}.`;
  return `I am becoming my best version through ${cleaned}.`;
}

export function buildImagePrompt(answers: SetupAnswers) {
  const visual = promptStyleForVibe(answers.vibe);
  return [
    "Create a polished square vibe artwork for a weekly glow-up checklist web app.",
    `Visual direction: ${visual}.`,
    `Audience and tone: ${answers.ageRange || "broad audience"}, ${answers.style || "fun but clean"}.`,
    `Personal vibe: ${answers.persona || "confident everyday person"}.`,
    `Original character direction: ${answers.visualIdentity || "stylized cozy avatar with a clear personality"}.`,
    `Artwork style: ${answers.artStyle || "modern soft anime-inspired planner art"}.`,
    `Main focus: ${answers.currentFocus || "healthy routines"}.`,
    "Use a fully original cartoon/anime/editorial character or named persona if provided. No brand logos, celebrity likeness, copyrighted character, or tiny unreadable UI text. Include expressive planner objects, a confident cozy scene, and space for code-native checklist UI to sit beside it.",
    "Modern social-app energy, premium, fun, inclusive, not childish, not cluttered."
  ].join(" ");
}

export function buildBackgroundPrompt(answers: SetupAnswers) {
  const visual = promptStyleForVibe(answers.vibe);
  return [
    "Create a wide abstract background for a modern weekly glow-up web app.",
    `Visual direction: ${visual}.`,
    `Mood: ${answers.persona || "calm confident reset"}, ${answers.artStyle || "soft polished illustration"}.`,
    "Translucent glass layers, airy depth, gentle light, soft grain, elegant color wash.",
    "No people, no readable text, no logos, no busy objects. Low contrast so app panels stay readable."
  ].join(" ");
}
