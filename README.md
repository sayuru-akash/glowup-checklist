# GlowUp Checklist

An AI-backed weekly glow-up checklist builder with Google sign-in, adaptive vibe setup, editable tasks, persistent account state, and generated theme artwork.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Production paths use:

- Google Identity Services credential flow
- server-side Google ID token verification
- signed HTTP-only session cookie
- Google AI `generateContent` for weekly plans
- Google AI image generation for vibe artwork
- Backblaze B2 object storage for generated poster/background images
- Postgres persistence for signed-in account state

## Google configuration

Create a Google OAuth web client in Google Cloud Console and set both:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

For local testing, add `http://localhost` and `http://localhost:3000` as Authorized JavaScript origins.

## Google AI configuration

Create a Google AI API key in Google AI Studio:

```bash
GEMINI_API_KEY=...
GEMINI_TEXT_MODEL=gemini-3-flash-preview
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image
```

`GEMINI_TEXT_MODEL` and `GEMINI_IMAGE_MODEL` are intentionally configurable because Google preview models change over time. The app does not silently fall back to fake generation when provider calls fail.

## Database

Use a separate Postgres database for this app. For Vercel, provision Neon through Vercel Marketplace, then set or pull:

```bash
DATABASE_URL=postgresql://...
```

Initialize the schema:

```bash
npm run db:init
```

The schema creates `glow_users` and `glow_states` only.

## Image storage

Generated artwork is uploaded to Backblaze B2 through the S3-compatible API. By default, the bucket can stay private: the app stores a same-origin `/api/media` URL and streams the image from B2 when the browser displays it.

Backblaze setup requirements:

- Create a private B2 bucket that is S3-compatible.
- Create a non-master application key for that bucket.
- Give the key write/read/delete file permissions plus `listAllBucketNames` for SDK compatibility when the key is bucket-restricted.
- Use the bucket's S3 endpoint, for example `https://s3.us-west-004.backblazeb2.com`; the region is the middle part, for example `us-west-004`.

Set:

```bash
B2_BUCKET=
B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com
B2_REGION=us-west-004
B2_KEY_ID=
B2_APPLICATION_KEY=
B2_PUBLIC_BASE_URL=
```

`B2_PUBLIC_BASE_URL` is optional. Use it when you want the bucket's Friendly URL origin or CDN URL, for example `https://f000.backblazeb2.com/file/your-bucket`. The image API returns an error when B2 storage is not configured. It does not return base64 images as a production fallback.

## Vercel

Set these environment variables in Vercel for Production, Preview, and Development:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_ID=
AUTH_SECRET=
GEMINI_API_KEY=
GEMINI_TEXT_MODEL=gemini-3-flash-preview
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image
DATABASE_URL=
B2_BUCKET=
B2_ENDPOINT=
B2_REGION=
B2_KEY_ID=
B2_APPLICATION_KEY=
B2_PUBLIC_BASE_URL=
```

After deployment, add the deployed Vercel origin to the Google OAuth web client's Authorized JavaScript origins.
