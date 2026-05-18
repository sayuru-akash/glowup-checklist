import { SignJWT, jwtVerify } from "jose";
import type { UserProfile } from "@/lib/types";

const cookieName = "glow_session";

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production.");
  }
  if (secret && secret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters.");
  }
  return new TextEncoder().encode(secret || "local-preview-secret-change-before-production-32");
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
