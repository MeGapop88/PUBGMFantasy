import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma's query engine is a native binary and bcryptjs reaches for node
  // built-ins — neither survives being bundled into the server chunk.
  serverExternalPackages: ["@prisma/client", "bcryptjs"],

  // Lets a verification build run to its own directory without clobbering the
  // dev server's .next (and vice versa). Defaults to the normal location.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
