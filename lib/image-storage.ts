import { randomUUID } from "node:crypto";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const mimeToExtension: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

let s3Client: S3Client | null = null;

export function imageStorageConfigured() {
  return Boolean(
    process.env.B2_BUCKET &&
      process.env.B2_ENDPOINT &&
      process.env.B2_REGION &&
      process.env.B2_KEY_ID &&
      process.env.B2_APPLICATION_KEY
  );
}

export async function storeGeneratedImage(input: { mime: string; base64: string; kind: "poster" | "background" }) {
  if (!imageStorageConfigured()) {
    throw new Error("Backblaze B2 image storage is not configured.");
  }

  const mime = input.mime || "image/png";
  const extension = mimeToExtension[mime] ?? "png";
  const bytes = Buffer.from(input.base64, "base64");
  if (!bytes.byteLength) {
    throw new Error("Generated image payload was empty.");
  }

  const today = new Date().toISOString().slice(0, 10);
  const key = `generated/${input.kind}/${today}/${randomUUID()}.${extension}`;
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: process.env.B2_BUCKET!,
      Key: key,
      Body: bytes,
      ContentType: mime,
      CacheControl: "public, max-age=2592000, immutable"
    })
  );

  return buildPublicUrl(key);
}

export async function loadGeneratedImage(key: string) {
  if (!imageStorageConfigured()) {
    throw new Error("Backblaze B2 image storage is not configured.");
  }
  if (!isGeneratedImageKey(key)) {
    throw new Error("Invalid generated image key.");
  }

  return getS3Client().send(
    new GetObjectCommand({
      Bucket: process.env.B2_BUCKET!,
      Key: key
    })
  );
}

function getS3Client() {
  s3Client ??= new S3Client({
    region: process.env.B2_REGION!,
    endpoint: normalizeEndpoint(process.env.B2_ENDPOINT!),
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.B2_KEY_ID!,
      secretAccessKey: process.env.B2_APPLICATION_KEY!
    }
  });

  return s3Client;
}

function buildPublicUrl(key: string) {
  const publicBase = process.env.B2_PUBLIC_BASE_URL?.trim();
  if (publicBase) {
    return `${publicBase.replace(/\/$/, "")}/${key}`;
  }

  return `/api/media?key=${encodeURIComponent(key)}`;
}

function normalizeEndpoint(value: string) {
  const trimmed = value.trim().replace(/\/$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function isGeneratedImageKey(key: string) {
  return /^generated\/(poster|background)\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]+\.(jpg|png|webp)$/.test(key);
}
