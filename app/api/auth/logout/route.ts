import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { noStoreHeaders } from "@/lib/http";
import { sessionCookieName } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName());
  return NextResponse.json({ ok: true }, { headers: noStoreHeaders });
}
