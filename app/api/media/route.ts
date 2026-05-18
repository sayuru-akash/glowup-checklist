import { NextResponse } from "next/server";
import { loadGeneratedImage } from "@/lib/image-storage";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "Image key is required." }, { status: 400 });
  }

  try {
    const object = await loadGeneratedImage(key);
    const bytes = await object.Body?.transformToByteArray();
    if (!bytes?.byteLength) {
      return NextResponse.json({ error: "Image was empty." }, { status: 502 });
    }

    const body = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(body).set(bytes);
    return new Response(body, {
      headers: {
        "Content-Type": object.ContentType || "image/png",
        "Cache-Control": "public, max-age=2592000, immutable"
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Image could not be loaded.", detail: error instanceof Error ? error.message : "Unknown error" },
      { status: 404 }
    );
  }
}
