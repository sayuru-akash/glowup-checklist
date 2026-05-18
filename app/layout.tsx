import type { Metadata } from "next";
import { Caveat, Fraunces, Nunito, Outfit, Patrick_Hand, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", display: "swap" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", display: "swap" });
const patrick = Patrick_Hand({ weight: "400", subsets: ["latin"], variable: "--font-patrick", display: "swap" });

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
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "GlowUp Checklist weekly planner" }],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "GlowUp Checklist",
    description: "AI-backed weekly planner with dynamic visuals, editable tasks, and saved progress.",
    images: ["/twitter-image.png"]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const fontVars = [nunito, outfit, jakarta, fraunces, caveat, patrick].map((font) => font.variable).join(" ");

  return (
    <html lang="en" className={fontVars}>
      <body>{children}</body>
    </html>
  );
}
