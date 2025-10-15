// app/manifest.ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Needix",
    short_name: "Needix",
    description: "Track subscriptions, expenses, and reorders in one place.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b11",
    theme_color: "#0b0b11",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png", purpose: "any" }
    ],
  };
}
