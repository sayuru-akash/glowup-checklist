import { OAuth2Client } from "google-auth-library";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { databaseConfigured, ensureSchema, upsertUser } from "@/lib/db";
import { createSessionToken, sessionCookieName } from "@/lib/session";
import type { UserProfile } from "@/lib/types";

const BodySchema = z.object({
  credential: z.string().min(20)
});

export async function POST(request: Request) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing Google credential." }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Google client ID is not configured." }, { status: 503 });
  }

  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({
    idToken: parsed.data.credential,
    audience: clientId
  });
  const payload = ticket.getPayload();

  if (!payload?.sub || !payload.email) {
    return NextResponse.json({ error: "Google profile is incomplete." }, { status: 401 });
  }

  const profile: UserProfile = {
    id: payload.sub,
    name: payload.name || payload.email.split("@")[0],
    email: payload.email,
    picture: payload.picture,
    authMode: "google"
  };

  if (databaseConfigured()) {
    await ensureSchema();
    await upsertUser(profile);
  }

  const token = await createSessionToken(profile);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14
  });

  return NextResponse.json({ profile });
}
