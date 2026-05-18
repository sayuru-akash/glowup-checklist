import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GlowUp Checklist",
    short_name: "GlowUp",
    description: "AI-backed weekly glow-up checklist with saved progress and editable tasks.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4e9ff",
    theme_color: "#26194a",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  };
}
