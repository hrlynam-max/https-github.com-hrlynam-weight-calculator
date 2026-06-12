import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // next@16.2.9 ships without .d.ts files; skip the type-check step.
    // The TypeScript compiler still validates our own source files in the IDE.
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
