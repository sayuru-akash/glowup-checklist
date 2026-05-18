import { NextResponse } from "next/server";
import { noStoreHeaders } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
      previewAuthEnabled: process.env.PREVIEW_AUTH_ENABLED === "true" && process.env.NODE_ENV !== "production"
    },
    { headers: noStoreHeaders }
  );
}
