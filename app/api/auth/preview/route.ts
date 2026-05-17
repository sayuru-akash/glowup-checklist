import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSessionToken, sessionCookieName } from "@/lib/session";
import type { UserProfile } from "@/lib/types";

export async function POST() {
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return NextResponse.json({ error: "Preview sign-in is disabled in production." }, { status: 403 });
  }

  const profile: UserProfile = {
    id: "preview-glow",
    name: "Glow Preview",
    email: "preview@glow.local",
    authMode: "preview"
  };
  const token = await createSessionToken(profile);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24
  });

  return NextResponse.json({ profile });
}
