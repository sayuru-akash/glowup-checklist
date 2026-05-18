import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";

const mimeToExtension: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

export function imageStorageConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function storeGeneratedImage(input: { mime: string; base64: string; kind: "poster" | "background" }) {
  if (!imageStorageConfigured()) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured.");
  }

  const mime = input.mime || "image/png";
  const extension = mimeToExtension[mime] ?? "png";
  const bytes = Buffer.from(input.base64, "base64");
  if (!bytes.byteLength) {
    throw new Error("Generated image payload was empty.");
  }

  const today = new Date().toISOString().slice(0, 10);
  const blob = await put(`generated/${input.kind}/${today}/${randomUUID()}.${extension}`, bytes, {
    access: "public",
    contentType: mime,
    addRandomSuffix: false,
    cacheControlMaxAge: 60 * 60 * 24 * 30
  });

  return blob.url;
}
