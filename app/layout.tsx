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
  title: "GlowUp Checklist",
  description: "Generate an AI-backed weekly glow-up checklist with Google sign-in, dynamic vibes, and editable tasks."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const fontVars = [nunito, outfit, jakarta, fraunces, caveat, patrick].map((font) => font.variable).join(" ");

  return (
    <html lang="en" className={fontVars}>
      <body>{children}</body>
    </html>
  );
}
