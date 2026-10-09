import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LuxStay — Curated Stays & Grand Resorts",
    short_name: "LuxStay",
    description:
      "Book trusted stays and discover verified Ethiopian places, heritage, and culture.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f3efe5",
    theme_color: "#0b1528",
    icons: [
      {
        src: "/icons/luxstay-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/luxstay-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  }
}
