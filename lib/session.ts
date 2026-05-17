import { SignJWT, jwtVerify } from "jose";
import type { UserProfile } from "@/lib/types";

const cookieName = "glow_session";

function secretKey() {
  const secret = process.env.AUTH_SECRET || "local-preview-secret-change-before-production-32";
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(profile: UserProfile) {
  return new SignJWT({ profile })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secretKey());
}

export async function readSessionToken(token?: string) {
  if (!token) return null;
  try {
    const verified = await jwtVerify(token, secretKey());
    const profile = verified.payload.profile as UserProfile | undefined;
    return profile ?? null;
  } catch {
    return null;
  }
}

export function sessionCookieName() {
  return cookieName;
}
