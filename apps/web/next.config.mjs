import { fileURLToPath } from "node:url"

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["http://192.168.1.12:4000", "http://192.168.1.19:4000"],
  outputFileTracingRoot: fileURLToPath(new URL("../../", import.meta.url)),
  images: {
    // Keep optimized variants warm so repeat/cold visits don't re-hit Wikimedia,
    // Unsplash, or other third-party origins (which rate-limit quickly).
    minimumCacheTTL: 60 * 60 * 24 * 7,
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      // Hotel/room images can be uploaded to any host, so allow http(s) broadly.
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  experimental: {
    // Keep production builds in-process in constrained development/CI
    // environments where compiler workers can fail without a useful error.
    webpackBuildWorker: false,
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@tanstack/react-query",
    ],
  },
}

export default nextConfig
