import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Authenticated data routes use request cookies and uncached database reads.
  // Keep the standard Node route runtime; Cache Components is unnecessary here.
  outputFileTracingRoot: process.cwd(),
  // Avoid stale persistent dev tasks observed in this Windows checkout.
  experimental: { turbopackFileSystemCacheForDev: false },
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
