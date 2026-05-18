"use client";

import {
  BadgeCheck,
  BookOpen,
  Bot,
  Camera,
  Check,
  ChevronRight,
  Droplets,
  Dumbbell,
  Edit3,
  Heart,
  Leaf,
  LogOut,
  Moon,
  Plus,
  RefreshCw,
  Salad,
  Share2,
  Sparkles,
  Star,
  Sun,
  Trash2,
  WandSparkles
} from "lucide-react";
import Script from "next/script";
import { useEffect, useMemo, useState } from "react";
import { fallbackPlan } from "@/lib/fallback";
import { fontClassMap, themeStyle, vibePresets } from "@/lib/theme";
import type { GlowTask, SetupAnswers, StoredAppState, UserProfile, WeeklyPlan } from "@/lib/types";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (element: HTMLElement, options: Record<string, string | number | boolean>) => void;
        };
      };
    };
  }
}

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const storageKey = "glowup-checklist-state-v1";

const questionSteps = [
  {
    key: "vibe",
    title: "Pick a starting vibe",
    sub: "Start somewhere. AI can still shift the final colors, fonts, and mood after your answers.",
    type: "vibe"
  },
  {
    key: "persona",
    title: "Who is this version of you?",
    sub: "Short and personal. This helps the plan sound like you.",
    placeholder: "Example: busy creative, soft but ambitious, wants calm confidence"
  },
  {
    key: "visualIdentity",
    title: "Describe your main character",
    sub: "Use your own traits, an original persona name, outfits, room details, mood, or cartoon/anime direction.",
    placeholder: "Example: Sayu, dark hair, lilac hoodie, cozy desk, skincare shelf, soft confident smile"
  },
  {
    key: "artStyle",
    title: "Pick a visual starting point",
    sub: "This is only the seed. AI still chooses the final character, colors, fonts, poster, and glassy background from all answers.",
    type: "artStyle"
  },
  {
    key: "currentFocus",
    title: "What are we glowing up first?",
    sub: "Skin, energy, study focus, confidence, fitness, routine, or anything else.",
    placeholder: "Example: feeling put together before work and staying consistent"
  },
  {
    key: "schedule",
    title: "What does your week actually look like?",
    sub: "The plan should fit real life, not fantasy life.",
    placeholder: "Example: Mon-Sat 8:00-5:30, tired evenings, Sunday reset"
  },
  {
    key: "blockers",
    title: "What usually breaks the streak?",
    sub: "This helps the generator make tasks small enough to survive the week.",
    placeholder: "Example: doom scrolling, no energy after class, skipping breakfast"
  },
  {
    key: "weeklyWin",
    title: "By Sunday, what should feel different?",
    sub: "Keep it honest and specific.",
    placeholder: "Example: I feel cleaner, calmer, and less behind"
  },
  {
    key: "intensity",
    title: "Choose the task load",
    sub: "You can still edit every task later.",
    type: "intensity"
  }
] as const;

const defaultAnswers: SetupAnswers = {
  vibe: "soft-pop",
  ageRange: "Gen Z to adult, inclusive and non-cringe",
  persona: "",
  visualIdentity: "",
  artStyle: "soft anime planner poster",
  currentFocus: "",
  schedule: "",
  energy: "medium",
  style: "fun, clean, social, not word heavy",
  blockers: "",
  weeklyWin: "",
  intensity: "balanced"
};

const categoryIcons: Record<GlowTask["category"], typeof Droplets> = {
  hydration: Droplets,
  skin: Sparkles,
  movement: Dumbbell,
  food: Salad,
  mind: Heart,
  style: Camera,
  study: BookOpen,
  sleep: Moon,
  social: Star
};

const artStyleChoices = [
  {
    value: "soft anime planner poster",
    label: "Soft anime glow",
    description: "Original anime-style character, cozy planner poster, polished"
  },
  {
    value: "sticker scrapbook cartoon",
    label: "Sticker diary",
    description: "Original cartoon persona, doodles, icons, playful social-board feel"
  },
  {
    value: "cozy room illustration",
    label: "Cozy room scene",
    description: "Original character in a warm desk scene with routine objects"
  },
  {
    value: "clean editorial avatar",
    label: "Editorial avatar",
    description: "Original character portrait, grown-up, crisp, creator profile"
  },
  {
    value: "bold social poster",
    label: "Main-character poster",
    description: "Original main-character poster, confident and scroll-stopping"
  }
];

export function GlowUpApp() {
  const [state, setState] = useState<StoredAppState | null>(null);
  const [booted, setBooted] = useState(false);
  const [answers, setAnswers] = useState<SetupAnswers>(defaultAnswers);
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [generationError, setGenerationError] = useState("");
  const [imageError, setImageError] = useState("");
  const [backgroundImageError, setBackgroundImageError] = useState("");
  const [syncError, setSyncError] = useState("");

  useEffect(() => {
    async function boot() {
      const stored = window.localStorage.getItem(storageKey);
      const parsed = stored ? (JSON.parse(stored) as StoredAppState) : null;
      const response = await fetch("/api/auth/me");
      const { profile } = (await response.json()) as { profile: UserProfile | null };
      if (profile) {
        const savedResponse = await fetch("/api/state");
        const payload = (await savedResponse.json().catch(() => null)) as { state?: StoredAppState; error?: string } | null;
        if (!savedResponse.ok) {
          setSyncError(formatUserError(payload?.error || "Database sync is not ready."));
        }
        const saved = payload?.state ? { ...payload.state, profile } : null;
        setState(saved ?? { profile });
        if (saved?.answers) setAnswers(saved.answers);
      } else {
        setState(parsed?.profile?.authMode === "preview" ? parsed : null);
      }
      setBooted(true);
    }
    boot().catch(() => setBooted(true));
  }, []);

  useEffect(() => {
    if (state?.profile?.authMode === "preview") {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [state]);

  useEffect(() => {
    if (!booted || state?.profile?.authMode !== "google") return;
    const timeout = window.setTimeout(async () => {
      const response = await fetch("/api/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state)
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setSyncError(formatUserError(payload?.error || "Database sync failed."));
      } else {
        setSyncError("");
      }
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [booted, state]);

  const plan = state?.plan;
  const activeDay = plan?.days.find((day) => day.id === state?.activeDayId) ?? plan?.days[0];
  const completed = plan?.days.flatMap((day) => day.tasks).filter((task) => task.completed).length ?? 0;
  const total = plan?.days.flatMap((day) => day.tasks).length ?? 0;
  const progress = total ? Math.round((completed / total) * 100) : 0;
  const activeTheme = plan?.theme ?? fallbackPlan(answers).theme;
  const appStyle = {
    ...themeStyle(activeTheme),
    "--generated-bg": state?.generatedBackgroundImage ? `url("${state.generatedBackgroundImage}")` : "none"
  } as React.CSSProperties;
  const fontClasses = [
    fontClassMap[activeTheme.fonts.body],
    `display-${activeTheme.fonts.display}`,
    `hand-${activeTheme.fonts.handwriting}`
  ].join(" ");

  const generatedLabel = useMemo(() => {
    if (generationError) return "generation error";
    if (!plan) return "setup";
    if (imageBusy) return "image generating";
    if (imageError || backgroundImageError) return "image error";
    return state?.generatedImage && state.generatedBackgroundImage ? "AI visuals ready" : "AI plan ready";
  }, [backgroundImageError, generationError, imageBusy, imageError, plan, state?.generatedBackgroundImage, state?.generatedImage]);

  async function signInPreview() {
    const response = await fetch("/api/auth/preview", { method: "POST" });
    const { profile } = (await response.json()) as { profile: UserProfile };
    setState({ profile });
  }

  async function handleGoogleCredential(credential: string) {
    const response = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential })
    });
    if (!response.ok) return;
    const { profile } = (await response.json()) as { profile: UserProfile };
    setState({ profile });
  }

  async function generatePlan(nextAnswers = answers) {
    if (!state?.profile) return;
    setGenerating(true);
    setGenerationError("");
    setImageError("");
    setBackgroundImageError("");

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextAnswers)
      });
      const payload = (await response.json()) as { plan?: WeeklyPlan; error?: string; detail?: string; source?: string };
      if (!response.ok || !payload.plan || payload.source !== "ai") {
        throw new Error(formatUserError(formatGenerationError(payload, "AI plan generation failed.")));
      }

      setState({
        profile: state.profile,
        answers: nextAnswers,
        plan: payload.plan,
        planSource: "ai",
        activeDayId: payload.plan.days[0]?.id,
        generatedAt: new Date().toISOString()
      });
      void generateVisuals(payload.plan);
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "AI plan generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  async function requestGeneratedImage(prompt: string, kind: "poster" | "background", fallback: string) {
    const response = await fetch("/api/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, kind })
    });
    const payload = (await response.json()) as {
      image?: string | null;
      error?: string;
      detail?: string;
      source?: string;
      storage?: string;
    };
    const image = payload.image;
    if (!response.ok || !image || payload.source !== "ai" || payload.storage !== "vercel-blob") {
      throw new Error(formatUserError(formatGenerationError(payload, fallback)));
    }

    return image;
  }

  async function generateVisuals(nextPlan: WeeklyPlan) {
    setImageBusy(true);
    setImageError("");
    setBackgroundImageError("");
    try {
      const backgroundPrompt =
        nextPlan.backgroundPrompt ||
        `Create a wide abstract glass background for a ${nextPlan.theme.name} weekly glow-up web app. No people, no readable text, no logos.`;
      const [posterResult, backgroundResult] = await Promise.allSettled([
        requestGeneratedImage(nextPlan.imagePrompt, "poster", "AI poster generation failed."),
        requestGeneratedImage(backgroundPrompt, "background", "AI background generation failed.")
      ]);
      const posterError = posterResult.status === "rejected" ? formatUserError(String(posterResult.reason?.message ?? posterResult.reason)) : "";
      const backgroundError =
        backgroundResult.status === "rejected" ? formatUserError(String(backgroundResult.reason?.message ?? backgroundResult.reason)) : "";

      setImageError(posterError);
      setBackgroundImageError(backgroundError);
      setState((current) =>
        current
          ? {
              ...current,
              generatedImage: posterResult.status === "fulfilled" ? posterResult.value : current.generatedImage,
              generatedBackgroundImage:
                backgroundResult.status === "fulfilled" ? backgroundResult.value : current.generatedBackgroundImage,
              imageSource: posterResult.status === "fulfilled" ? "ai" : current.imageSource,
              backgroundImageSource: backgroundResult.status === "fulfilled" ? "ai" : current.backgroundImageSource,
              imageError: posterError,
              backgroundImageError: backgroundError
            }
          : current
      );
    } finally {
      setImageBusy(false);
    }
  }

  async function resetSetup() {
    if (state?.profile.authMode === "google") {
      await fetch("/api/state", { method: "DELETE" }).catch(() => null);
    }
    window.localStorage.removeItem(storageKey);
    setAnswers(defaultAnswers);
    setStep(0);
    setGenerationError("");
    setImageError("");
    setBackgroundImageError("");
    setSyncError("");
    setState((current) =>
      current
        ? {
            profile: current.profile
          }
        : current
    );
  }

  function updateTask(dayId: string, taskId: string, patch: Partial<GlowTask>) {
    setState((current) => {
      if (!current?.plan) return current;
      return {
        ...current,
        plan: {
          ...current.plan,
          days: current.plan.days.map((day) =>
            day.id === dayId
              ? { ...day, tasks: day.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)) }
              : day
          )
        }
      };
    });
  }

  function updatePlanMeta(patch: Partial<Pick<WeeklyPlan, "title" | "subtitle" | "note" | "weeklyMantra">>) {
    setState((current) => {
      if (!current?.plan) return current;
      return {
        ...current,
        plan: {
          ...current.plan,
          ...patch
        }
      };
    });
  }

  function addTask() {
    if (!activeDay || !newTask.trim()) return;
    const task: GlowTask = {
      id: `custom-${Date.now()}`,
      label: newTask.trim(),
      category: "mind",
      minutes: 5,
      completed: false
    };
    setState((current) => {
      if (!current?.plan) return current;
      return {
        ...current,
        plan: {
          ...current.plan,
          days: current.plan.days.map((day) => (day.id === activeDay.id ? { ...day, tasks: [...day.tasks, task] } : day))
        }
      };
    });
    setNewTask("");
  }

  function removeTask(dayId: string, taskId: string) {
    setState((current) => {
      if (!current?.plan) return current;
      return {
        ...current,
        plan: {
          ...current.plan,
          days: current.plan.days.map((day) =>
            day.id === dayId ? { ...day, tasks: day.tasks.filter((task) => task.id !== taskId) } : day
          )
        }
      };
    });
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.localStorage.removeItem(storageKey);
    setState(null);
  }

  function formatGenerationError(payload: { error?: string; detail?: string }, fallback: string) {
    return [payload.error || fallback, payload.detail].filter(Boolean).join(" ");
  }

  function formatUserError(message: string) {
    return message.replaceAll("Gemini", "AI").replaceAll("GEMINI", "AI");
  }

  if (!booted) {
    return (
      <main className="loading-screen">
        <Sparkles aria-hidden />
      </main>
    );
  }

  return (
    <main className={`app-shell ${fontClasses}`} style={appStyle}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <div className="brand-lockup" aria-label="GlowUp Checklist">
          <span className="brand-mark">
            <Sparkles size={20} aria-hidden />
          </span>
          <span>GlowUp Checklist</span>
        </div>
        <div className="top-actions">
          {state?.profile ? (
            <>
              <span className="status-chip">{generatedLabel}</span>
              {plan ? (
                <button className="text-button compact" type="button" onClick={resetSetup}>
                  <RefreshCw size={16} aria-hidden />
                  Reset setup
                </button>
              ) : null}
              <button className="icon-button" type="button" onClick={logout} aria-label="Sign out">
                <LogOut size={18} aria-hidden />
              </button>
            </>
          ) : null}
        </div>
      </header>

      {syncError ? (
        <div className="global-error" role="alert">
          <Bot size={18} aria-hidden />
          <span>{syncError}</span>
        </div>
      ) : null}

      {!state?.profile ? (
        <AuthPanel onPreview={signInPreview} onGoogle={handleGoogleCredential} />
      ) : !plan ? (
        <SetupWizard
          answers={answers}
          setAnswers={setAnswers}
          step={step}
          setStep={setStep}
          generating={generating}
          generationError={generationError}
          onGenerate={() => generatePlan(answers)}
        />
      ) : (
        <section className="workspace">
          <aside className="hero-panel">
            <div className="profile-row">
              {state.profile.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={state.profile.picture} alt="" width={42} height={42} className="avatar" />
              ) : (
                <span className="avatar fallback-avatar">{state.profile.name.slice(0, 1)}</span>
              )}
              <div>
                <p>{state.profile.name}</p>
                <span>{state.profile.authMode === "google" ? "Google account synced" : "Preview account"}</span>
              </div>
            </div>

            <div className="art-card">
              {state.generatedImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={state.generatedImage} alt="Generated glow-up vibe artwork" />
              ) : imageError ? (
                <div className="poster-fallback error-state">
                  <Bot aria-hidden />
                  <span>Image needs a real AI response</span>
                  <p>{imageError}</p>
                </div>
              ) : (
                <div className="poster-fallback">
                  <Sparkles aria-hidden />
                  <span>{activeTheme.name}</span>
                  <p>{activeTheme.motifs.join(" · ")}</p>
                </div>
              )}
              {imageBusy ? (
                <div className="art-refreshing" aria-live="polite">
                  <RefreshCw className="spin" size={16} aria-hidden />
                  <span>Refreshing visuals</span>
                </div>
              ) : null}
            </div>

            <div className="progress-card">
              <div className="progress-ring" style={{ "--progress": `${progress}%` } as React.CSSProperties}>
                <span>{progress}%</span>
              </div>
              <div>
                <input
                  className="plan-title-input"
                  value={plan.title}
                  onChange={(event) => updatePlanMeta({ title: event.target.value })}
                  aria-label="Plan title"
                />
                <input
                  className="plan-subtitle-input"
                  value={plan.subtitle}
                  onChange={(event) => updatePlanMeta({ subtitle: event.target.value })}
                  aria-label="Plan subtitle"
                />
              </div>
            </div>

            <blockquote>
              <Heart size={18} aria-hidden />
              <textarea
                value={plan.weeklyMantra}
                onChange={(event) => updatePlanMeta({ weeklyMantra: event.target.value })}
                aria-label="Weekly mantra"
              />
            </blockquote>
          </aside>

          <section className="checklist-panel">
            <div className="panel-heading">
              <div>
                <p className="script-label">Weekly vibe</p>
                <h1>{activeDay?.focus}</h1>
              </div>
              <button className="text-button" type="button" onClick={() => generatePlan(state.answers ?? answers)} disabled={generating}>
                <RefreshCw size={17} aria-hidden />
                Re-roll week
              </button>
            </div>

            <nav className="day-tabs" aria-label="Week days">
              {plan.days.map((day) => {
                const dayDone = day.tasks.filter((task) => task.completed).length;
                return (
                  <button
                    key={day.id}
                    className={day.id === activeDay?.id ? "day-tab active" : "day-tab"}
                    type="button"
                    onClick={() => setState((current) => (current ? { ...current, activeDayId: day.id } : current))}
                  >
                    <span>{day.label}</span>
                    <small>
                      {dayDone}/{day.tasks.length}
                    </small>
                  </button>
                );
              })}
            </nav>

            {activeDay ? (
              <div className="task-stack">
                <div className="day-note">
                  <Sun size={18} aria-hidden />
                  <span>{activeDay.affirmation}</span>
                </div>

                {activeDay.tasks.map((task) => {
                  const Icon = categoryIcons[task.category] ?? Sparkles;
                  return (
                    <article key={task.id} className={task.completed ? "task-row done" : "task-row"}>
                      <button
                        className="check-button"
                        type="button"
                        onClick={() => updateTask(activeDay.id, task.id, { completed: !task.completed })}
                        aria-label={task.completed ? "Mark task incomplete" : "Mark task complete"}
                      >
                        {task.completed ? <Check size={18} aria-hidden /> : null}
                      </button>
                      <span className="task-icon">
                        <Icon size={21} aria-hidden />
                      </span>
                      <label>
                        <input
                          value={task.label}
                          onChange={(event) => updateTask(activeDay.id, task.id, { label: event.target.value })}
                          aria-label="Task label"
                        />
                        <input
                          className="task-detail-input"
                          value={task.detail ?? ""}
                          onChange={(event) => updateTask(activeDay.id, task.id, { detail: event.target.value })}
                          placeholder="Add detail"
                          aria-label="Task detail"
                        />
                      </label>
                      <span className="minutes">{task.minutes}m</span>
                      <button
                        className="ghost-icon"
                        type="button"
                        onClick={() => removeTask(activeDay.id, task.id)}
                        aria-label="Remove task"
                      >
                        <Trash2 size={16} aria-hidden />
                      </button>
                    </article>
                  );
                })}

                <div className="add-task">
                  <Edit3 size={18} aria-hidden />
                  <input
                    value={newTask}
                    onChange={(event) => setNewTask(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") addTask();
                    }}
                    placeholder="Add a custom tiny task"
                  />
                  <button type="button" onClick={addTask} aria-label="Add task">
                    <Plus size={18} aria-hidden />
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          <aside className="side-panel">
            <section>
              <p className="script-label">Note</p>
              <textarea
                className="note-input"
                value={plan.note}
                onChange={(event) => updatePlanMeta({ note: event.target.value })}
                aria-label="Week note"
              />
            </section>
            <section>
              <p className="script-label">Theme system</p>
              <div className="swatches">
                {Object.entries(activeTheme.palette).slice(0, 7).map(([name, value]) => (
                  <span key={name} style={{ background: value }} title={name} />
                ))}
              </div>
              <p className="tiny-copy">{activeTheme.motifs.join(" · ")}</p>
            </section>
            <section>
              <p className="script-label">Visuals</p>
              <h3>{state.generatedImage ? "Poster ready" : imageBusy ? "Making poster" : "Poster pending"}</h3>
              <p className={backgroundImageError ? "tiny-copy error-copy" : "tiny-copy"}>
                Background: {state.generatedBackgroundImage ? "ready" : backgroundImageError ? "blocked" : imageBusy ? "generating" : "pending"}
              </p>
              {imageError || backgroundImageError ? <p className="tiny-copy error-copy">{imageError || backgroundImageError}</p> : null}
              <button className="text-button full visual-refresh" type="button" onClick={() => generateVisuals(plan)} disabled={imageBusy}>
                <RefreshCw size={16} aria-hidden />
                Refresh visuals
              </button>
            </section>
            <section className="share-card">
              <BadgeCheck size={22} aria-hidden />
              <h3>{completed} basics done</h3>
              <p>Keep it editable. Keep it real. Keep glowing.</p>
              <button className="text-button full" type="button" onClick={() => navigator.clipboard?.writeText(plan.weeklyMantra)}>
                <Share2 size={17} aria-hidden />
                Copy mantra
              </button>
            </section>
          </aside>
        </section>
      )}
    </main>
  );
}

function AuthPanel({ onPreview, onGoogle }: { onPreview: () => void; onGoogle: (credential: string) => void }) {
  const [gisReady, setGisReady] = useState(false);

  useEffect(() => {
    if (!gisReady || !clientId || !window.google?.accounts?.id) return;
    const button = document.getElementById("googleSignInButton");
    if (!button) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: ({ credential }) => onGoogle(credential)
    });
    button.innerHTML = "";
    window.google.accounts.id.renderButton(button, {
      theme: "outline",
      size: "large",
      shape: "pill",
      text: "continue_with",
      width: 280
    });
  }, [gisReady, onGoogle]);

  return (
    <section className="auth-grid">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setGisReady(true)} />
      <div className="intro-copy">
        <p className="script-label">small steps · every day · big transformation</p>
        <h1>Your glow-up week.</h1>
        <p>Sign in, answer the vibe prompts, then edit the plan and visuals until it feels like you.</p>
        <div className="auth-actions">
          {clientId ? <div id="googleSignInButton" className="google-slot" /> : null}
          <button className="primary-button" type="button" onClick={onPreview}>
            <Sparkles size={18} aria-hidden />
            Try preview mode
          </button>
        </div>
      </div>
      <div className="reference-board" aria-label="Glow-up preview board">
        <div className="sticker one">You got this</div>
        <div className="board-title">
          <Sparkles aria-hidden />
          <span>Weekly</span>
          <strong>Glow-Up</strong>
        </div>
        {["Drink water", "Skincare", "Move 15 min", "Eat one real meal", "Mind reset"].map((item) => (
          <div className="mini-row" key={item}>
            <span />
            <Heart size={16} aria-hidden />
            <p>{item}</p>
          </div>
        ))}
        <div className="sticker two">Love yourself</div>
      </div>
    </section>
  );
}

function SetupWizard({
  answers,
  setAnswers,
  step,
  setStep,
  generating,
  generationError,
  onGenerate
}: {
  answers: SetupAnswers;
  setAnswers: (answers: SetupAnswers) => void;
  step: number;
  setStep: (step: number) => void;
  generating: boolean;
  generationError: string;
  onGenerate: () => void;
}) {
  const current = questionSteps[step];
  const isLast = step === questionSteps.length - 1;

  function next() {
    if (isLast) onGenerate();
    else setStep(step + 1);
  }

  return (
    <section className="wizard">
      <div className="wizard-card">
        <div className="wizard-progress">
          {questionSteps.map((item, index) => (
            <span key={item.key} className={index <= step ? "active" : ""} />
          ))}
        </div>
        <p className="script-label">Step {step + 1}</p>
        <h1>{current.title}</h1>
        <p>{current.sub}</p>

        {"type" in current && current.type === "vibe" ? (
          <div className="vibe-grid">
            {Object.values(vibePresets).map((preset) => (
              <button
                key={preset.vibe}
                className={answers.vibe === preset.vibe ? "vibe-choice selected" : "vibe-choice"}
                type="button"
                onClick={() => setAnswers({ ...answers, vibe: preset.vibe })}
                style={{ "--choice": preset.palette.accent, "--choice-bg": preset.palette.surfaceStrong } as React.CSSProperties}
              >
                <span>{preset.label}</span>
                <small>{preset.motifs.slice(0, 2).join(" + ")}</small>
              </button>
            ))}
          </div>
        ) : "type" in current && current.type === "intensity" ? (
          <div className="intensity-grid">
            {(["soft", "balanced", "ambitious"] as const).map((intensity) => (
              <button
                key={intensity}
                className={answers.intensity === intensity ? "intensity selected" : "intensity"}
                type="button"
                onClick={() => setAnswers({ ...answers, intensity })}
              >
                <span>{intensity}</span>
                <small>{intensity === "soft" ? "5/day" : intensity === "ambitious" ? "7/day" : "6/day"}</small>
              </button>
            ))}
          </div>
        ) : "type" in current && current.type === "artStyle" ? (
          <div className="art-style-grid">
            {artStyleChoices.map((choice) => (
              <button
                key={choice.value}
                className={answers.artStyle === choice.value ? "art-style-choice selected" : "art-style-choice"}
                type="button"
                onClick={() => setAnswers({ ...answers, artStyle: choice.value })}
              >
                <span>{choice.label}</span>
                <small>{choice.description}</small>
              </button>
            ))}
          </div>
        ) : (
          <textarea
            value={answers[current.key as keyof SetupAnswers] as string}
            onChange={(event) => setAnswers({ ...answers, [current.key]: event.target.value })}
            placeholder={"placeholder" in current ? current.placeholder : undefined}
            rows={5}
          />
        )}

        {generationError ? (
          <div className="error-banner" role="alert">
            <Bot size={18} aria-hidden />
            <span>{generationError}</span>
          </div>
        ) : null}

        <div className="wizard-actions">
          <button className="text-button" type="button" disabled={step === 0} onClick={() => setStep(Math.max(0, step - 1))}>
            Back
          </button>
          <button className="primary-button" type="button" onClick={next} disabled={generating}>
            {generating ? <Bot className="spin" size={18} aria-hidden /> : <WandSparkles size={18} aria-hidden />}
            {isLast ? "Generate my week" : "Next"}
            {!isLast ? <ChevronRight size={16} aria-hidden /> : null}
          </button>
        </div>
      </div>
    </section>
  );
}
