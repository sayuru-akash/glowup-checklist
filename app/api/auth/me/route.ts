import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { noStoreHeaders } from "@/lib/http";
import { readSessionToken, sessionCookieName } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const profile = await readSessionToken(cookieStore.get(sessionCookieName())?.value);
  return NextResponse.json({ profile }, { headers: noStoreHeaders });
}
