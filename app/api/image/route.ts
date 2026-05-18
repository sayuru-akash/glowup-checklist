import { NextResponse } from "next/server";
import { z } from "zod";
import { imageStorageConfigured, storeGeneratedImage } from "@/lib/image-storage";

export const runtime = "nodejs";

const BodySchema = z.object({
  prompt: z.string().min(20).max(1200),
  kind: z.enum(["poster", "background"]).default("poster")
});

type GeminiPart = {
  text?: string;
  inlineData?: { mimeType?: string; data?: string };
  inline_data?: { mime_type?: string; data?: string };
};

export async function POST(request: Request) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Image prompt is required." }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI API key is not configured." }, { status: 503 });
  }
  if (!imageStorageConfigured()) {
    return NextResponse.json({ error: "Image storage is not configured." }, { status: 503 });
  }

  try {
    const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: parsed.data.prompt }] }],
        generationConfig: {
          responseModalities: ["IMAGE"]
        }
      })
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "AI image request failed.", detail: await readProviderError(response) },
        { status: 502 }
      );
    }

    const data = await response.json();
    const parts: GeminiPart[] = data?.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((part) => part.inlineData?.data || part.inline_data?.data);
    const inline = imagePart?.inlineData
      ? { mime: imagePart.inlineData.mimeType, data: imagePart.inlineData.data }
      : { mime: imagePart?.inline_data?.mime_type, data: imagePart?.inline_data?.data };
    if (!inline?.data) {
      return NextResponse.json({ error: "AI returned no image data." }, { status: 502 });
    }

    const mime = inline.mime || "image/png";
    const image = await storeGeneratedImage({ mime, base64: inline.data, kind: parsed.data.kind });
    return NextResponse.json({ image, source: "ai", storage: "backblaze-b2" });
  } catch (error) {
    return NextResponse.json(
      { error: "AI image output could not be read.", detail: error instanceof Error ? error.message : "Unknown error" },
      { status: 502 }
    );
  }
}

async function readProviderError(response: Response) {
  const body = await response.text().catch(() => "");
  if (!body) return `HTTP ${response.status}`;

  try {
    const parsed = JSON.parse(body) as { error?: { message?: string; status?: string } };
    return parsed.error?.message || parsed.error?.status || `HTTP ${response.status}`;
  } catch {
    return body.slice(0, 240);
  }
}
