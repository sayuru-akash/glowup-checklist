import type { Metadata } from "next";
import "@fontsource-variable/caveat";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/nunito";
import "@fontsource-variable/outfit";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource/patrick-hand/400.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://glowup.chamudi.xyz"),
  applicationName: "GlowUp Checklist",
  title: {
    default: "GlowUp Checklist",
    template: "%s | GlowUp Checklist"
  },
  description:
    "Generate an AI-backed weekly glow-up checklist with Google sign-in, dynamic themes, editable tasks, and saved progress.",
  keywords: ["glow-up checklist", "weekly planner", "AI planner", "habit checklist", "routine planner"],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "GlowUp Checklist",
    description: "AI-backed weekly planner with dynamic visuals, editable tasks, and saved progress.",
    url: "/",
    siteName: "GlowUp Checklist",
    images: [{ url: "/opengraph-image.jpg", width: 1280, height: 720, alt: "GlowUp Checklist weekly planner" }],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "GlowUp Checklist",
    description: "AI-backed weekly planner with dynamic visuals, editable tasks, and saved progress.",
    images: ["/twitter-image.jpg"]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
