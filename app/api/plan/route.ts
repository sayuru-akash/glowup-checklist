import { NextResponse } from "next/server";
import { z } from "zod";
import { noStoreHeaders } from "@/lib/http";
import type { FontKey, ThemeSpec, WeeklyPlan } from "@/lib/types";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  vibe: z.enum(["soft-pop", "clean-reset", "main-character", "study-core", "power-mode"]),
  ageRange: z.string().max(80).default(""),
  persona: z.string().max(180).default(""),
  visualIdentity: z.string().max(240).default(""),
  artStyle: z.string().max(120).default(""),
  currentFocus: z.string().max(160).default(""),
  schedule: z.string().max(160).default(""),
  energy: z.string().max(160).default(""),
  style: z.string().max(160).default(""),
  blockers: z.string().max(220).default(""),
  weeklyWin: z.string().max(180).default(""),
  intensity: z.enum(["soft", "balanced", "ambitious"]).default("balanced")
});

export async function POST(request: Request) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Setup answers are incomplete." }, { status: 400, headers: noStoreHeaders });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI API key is not configured." }, { status: 503, headers: noStoreHeaders });
  }

  try {
    const model = process.env.GEMINI_TEXT_MODEL || "gemini-3-flash-preview";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: buildPlannerPrompt(parsed.data) }]
          }
        ],
        generationConfig: {
          temperature: 0.8,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "AI plan request failed.", detail: await readProviderError(response) },
        { status: 502, headers: noStoreHeaders }
      );
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.find((part: { text?: string }) => part.text)?.text;
    if (!text) {
      return NextResponse.json({ error: "AI returned no plan text." }, { status: 502, headers: noStoreHeaders });
    }

    const generated = normalizePlan(JSON.parse(text), parsed.data);
    return NextResponse.json({ plan: generated, source: "ai" }, { headers: noStoreHeaders });
  } catch (error) {
    return NextResponse.json(
      { error: "AI plan output could not be parsed.", detail: error instanceof Error ? error.message : "Unknown error" },
      { status: 502, headers: noStoreHeaders }
    );
  }
}

function buildPlannerPrompt(input: z.infer<typeof BodySchema>) {
  return `Return only valid JSON for a weekly glow-up checklist web app.
Use compact, high-quality output. No markdown.
User setup:
- vibe: ${input.vibe}
- audience/age: ${input.ageRange || "broad"}
- personal vibe: ${input.persona || "not specified"}
- original character direction: ${input.visualIdentity || "stylized inclusive character with a clear personality"}
- preferred artwork style: ${input.artStyle || "polished modern cartoon/anime-inspired planner art"}
- current focus: ${input.currentFocus || "healthy basics"}
- schedule: ${input.schedule || "busy"}
- energy: ${input.energy || "medium"}
- visual style: ${input.style || "fun, clean, modern"}
- blockers: ${input.blockers || "consistency"}
- weekly win: ${input.weeklyWin || "feel more put together"}
- intensity: ${input.intensity}

JSON shape:
{
  "title": "short title",
  "subtitle": "short subtitle",
  "note": "short note about user's schedule",
  "weeklyMantra": "one sentence",
  "theme": {
    "name": "2-4 words",
    "vibe": "soft-pop|clean-reset|main-character|study-core|power-mode",
    "palette": {
      "background": "#hex",
      "surface": "#hex",
      "surfaceStrong": "#hex",
      "ink": "#hex",
      "muted": "#hex",
      "accent": "#hex",
      "accentStrong": "#hex",
      "highlight": "#hex",
      "border": "#hex"
    },
    "fonts": {
      "display": "nunito|outfit|jakarta|fraunces",
      "body": "nunito|outfit|jakarta",
      "handwriting": "caveat|patrick"
    },
    "motifs": ["single word", "single word", "single word"],
    "iconStyle": "rounded|spark|sharp|soft"
  },
  "days": [
    {
      "label": "Mon",
      "focus": "2-5 words",
      "affirmation": "short sentence",
      "tasks": [
        {"label":"specific task under 8 words","detail":"optional detail under 12 words","category":"hydration|skin|movement|food|mind|style|study|sleep|social","minutes":5}
      ]
    }
  ],
  "imagePrompt": "single polished image prompt under 105 words for the main poster/avatar artwork",
  "backgroundPrompt": "single polished image prompt under 80 words for an abstract glassy app background"
}
Rules: exactly 7 days Mon-Sun. ${input.intensity === "soft" ? "5" : input.intensity === "ambitious" ? "7" : "6"} tasks per day. Make tasks practical, varied, inclusive, low-friction, and editable. Avoid medical claims, shame, and perfectionism.
Pick the final theme, colors, fonts, motifs, and icon style from the user's full setup. Treat their first vibe and artwork choice as starting directions, not commands.
Palette must be app-usable: strong text contrast, light-friendly, not a one-note monochrome palette, and all values must be six-digit hex.
imagePrompt should request a tasteful original cartoon/anime/editorial character, named persona, or poster based on the user's description. It may use a user-provided personal name/persona name as the character name, but must not copy a real public figure, celebrity likeness, brand logo, or copyrighted character.
backgroundPrompt should be a soft abstract version of the same theme for a web app background: translucent glass panels, airy depth, low-contrast, matching palette, no readable text, no faces, no busy objects.`;
}

function normalizePlan(raw: Partial<WeeklyPlan> & { themeName?: string; themeVibe?: unknown }, input: z.infer<typeof BodySchema>): WeeklyPlan {
  if (!Array.isArray(raw.days) || raw.days.length !== 7) {
    throw new Error("Plan must include exactly 7 days.");
  }

  const theme = requireTheme(raw.theme);
  const taskTarget = input.intensity === "soft" ? 5 : input.intensity === "ambitious" ? 7 : 6;

  return {
    theme,
    title: requireString(raw.title, "title", 80),
    subtitle: requireString(raw.subtitle, "subtitle", 120),
    note: requireString(raw.note, "note", 140),
    weeklyMantra: requireString(raw.weeklyMantra, "weeklyMantra", 180),
    imagePrompt: requireString(raw.imagePrompt, "imagePrompt", 700),
    backgroundPrompt: requireString(raw.backgroundPrompt, "backgroundPrompt", 620),
    days: raw.days.map((day, dayIndex) => {
      if (!Array.isArray(day.tasks) || day.tasks.length < taskTarget) {
        throw new Error(`Day ${dayIndex + 1} must include at least ${taskTarget} tasks.`);
      }

      return {
      id: `day-${dayIndex}`,
      label: requireString(day.label, `days.${dayIndex}.label`, 8),
      focus: requireString(day.focus, `days.${dayIndex}.focus`, 48),
      affirmation: requireString(day.affirmation, `days.${dayIndex}.affirmation`, 100),
      tasks: day.tasks.slice(0, 8).map((task, taskIndex) => ({
        id: `day-${dayIndex}-task-${taskIndex}`,
        label: requireString(task.label, `days.${dayIndex}.tasks.${taskIndex}.label`, 90),
        detail: typeof task.detail === "string" ? task.detail.slice(0, 90) : "",
        category: requireCategory(task.category, `days.${dayIndex}.tasks.${taskIndex}.category`),
        minutes: typeof task.minutes === "number" ? Math.max(1, Math.min(60, Math.round(task.minutes))) : 5,
        completed: false
      }))
    };
    })
  };
}

function requireTheme(value: unknown): ThemeSpec {
  if (!value || typeof value !== "object") {
    throw new Error("Missing theme.");
  }
  const theme = value as Partial<ThemeSpec>;
  const palette = theme.palette;
  const fonts = theme.fonts;
  if (!palette || typeof palette !== "object") {
    throw new Error("Missing theme.palette.");
  }
  if (!fonts || typeof fonts !== "object") {
    throw new Error("Missing theme.fonts.");
  }

  return {
    name: requireString(theme.name, "theme.name", 42),
    vibe: requireVibe(theme.vibe),
    palette: {
      background: requireHexColor(palette.background, "theme.palette.background"),
      surface: requireHexColor(palette.surface, "theme.palette.surface"),
      surfaceStrong: requireHexColor(palette.surfaceStrong, "theme.palette.surfaceStrong"),
      ink: requireHexColor(palette.ink, "theme.palette.ink"),
      muted: requireHexColor(palette.muted, "theme.palette.muted"),
      accent: requireHexColor(palette.accent, "theme.palette.accent"),
      accentStrong: requireHexColor(palette.accentStrong, "theme.palette.accentStrong"),
      highlight: requireHexColor(palette.highlight, "theme.palette.highlight"),
      border: requireHexColor(palette.border, "theme.palette.border")
    },
    fonts: {
      display: requireFont(fonts.display, "theme.fonts.display", ["nunito", "outfit", "jakarta", "fraunces"]),
      body: requireFont(fonts.body, "theme.fonts.body", ["nunito", "outfit", "jakarta"]),
      handwriting: requireFont(fonts.handwriting, "theme.fonts.handwriting", ["caveat", "patrick"])
    },
    motifs: requireMotifs(theme.motifs),
    iconStyle: requireIconStyle(theme.iconStyle)
  };
}

function requireVibe(value: unknown) {
  if (
    typeof value === "string" &&
    ["soft-pop", "clean-reset", "main-character", "study-core", "power-mode"].includes(value)
  ) {
    return value as z.infer<typeof BodySchema>["vibe"];
  }

  throw new Error("Invalid theme.vibe.");
}

function requireString(value: unknown, field: string, maxLength: number) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing ${field}.`);
  }

  return value.trim().slice(0, maxLength);
}

function requireHexColor(value: unknown, field: string) {
  if (typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value.trim())) {
    return value.trim();
  }

  throw new Error(`Invalid ${field}.`);
}

function requireFont(value: unknown, field: string, allowed: FontKey[]) {
  if (typeof value === "string" && allowed.includes(value as FontKey)) {
    return value as FontKey;
  }

  throw new Error(`Invalid ${field}.`);
}

function requireMotifs(value: unknown) {
  if (!Array.isArray(value) || value.length < 2) {
    throw new Error("Missing theme.motifs.");
  }

  return value.slice(0, 5).map((item, index) => requireString(item, `theme.motifs.${index}`, 28));
}

function requireIconStyle(value: unknown): ThemeSpec["iconStyle"] {
  if (typeof value === "string" && ["rounded", "spark", "sharp", "soft"].includes(value)) {
    return value as ThemeSpec["iconStyle"];
  }

  throw new Error("Invalid theme.iconStyle.");
}

function requireCategory(value: unknown, field: string): WeeklyPlan["days"][number]["tasks"][number]["category"] {
  if (
    typeof value === "string" &&
    ["hydration", "skin", "movement", "food", "mind", "style", "study", "sleep", "social"].includes(value)
  ) {
    return value as WeeklyPlan["days"][number]["tasks"][number]["category"];
  }

  throw new Error(`Invalid ${field}.`);
}

async function readProviderError(response: Response) {
  const body = await response.text().catch(() => "");
  if (!body) return `HTTP ${response.status}`;

  try {
    const parsed = JSON.parse(body) as { error?: { message?: string; status?: string } };
    return parsed.error?.message || parsed.error?.status || `HTTP ${response.status}`;
  } catch {
    return body.slice(0, 240);
  }
}
