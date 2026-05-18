import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { clearUserState, databaseConfigured, ensureSchema, loadUserState, saveUserState, upsertUser } from "@/lib/db";
import { readSessionToken, sessionCookieName } from "@/lib/session";
import type { StoredAppState } from "@/lib/types";

const StateSchema = z.object({
  profile: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    picture: z.string().optional(),
    authMode: z.literal("google")
  }),
  answers: z.unknown().optional(),
  plan: z.unknown().optional(),
  activeDayId: z.string().optional(),
  generatedImage: z.string().optional(),
  generatedBackgroundImage: z.string().optional(),
  planSource: z.union([z.literal("ai"), z.literal("gemini")]).optional(),
  imageSource: z.union([z.literal("ai"), z.literal("gemini")]).optional(),
  backgroundImageSource: z.union([z.literal("ai"), z.literal("gemini")]).optional(),
  generationError: z.string().optional(),
  imageError: z.string().optional(),
  backgroundImageError: z.string().optional(),
  generatedAt: z.string().optional()
});

export async function GET() {
  const session = await requireSession();
  if ("error" in session) return session.error;

  if (!databaseConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL is not configured." }, { status: 503 });
  }

  await ensureSchema();
  const state = await loadUserState(session.profile.id);
  return NextResponse.json({ state });
}

export async function PUT(request: Request) {
  const session = await requireSession();
  if ("error" in session) return session.error;

  if (!databaseConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL is not configured." }, { status: 503 });
  }

  const parsed = StateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "State payload is invalid." }, { status: 400 });
  }

  const state = parsed.data as StoredAppState;
  const normalized: StoredAppState = {
    ...state,
    profile: session.profile,
    planSource: state.planSource ? "ai" : undefined,
    imageSource: state.imageSource ? "ai" : undefined,
    backgroundImageSource: state.backgroundImageSource ? "ai" : undefined
  };
  await ensureSchema();
  await upsertUser(session.profile);
  await saveUserState(session.profile.id, normalized);

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await requireSession();
  if ("error" in session) return session.error;

  if (!databaseConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL is not configured." }, { status: 503 });
  }

  await ensureSchema();
  await clearUserState(session.profile.id);
  return NextResponse.json({ ok: true });
}

async function requireSession() {
  const cookieStore = await cookies();
  const profile = await readSessionToken(cookieStore.get(sessionCookieName())?.value);
  if (!profile || profile.authMode !== "google") {
    return { error: NextResponse.json({ error: "Google sign-in is required." }, { status: 401 }) };
  }

  return { profile };
}
