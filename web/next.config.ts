import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Oshi repo root holds the Expo app's lockfile too; pin Turbopack to web/
  // so it doesn't infer the monorepo root from the wrong lockfile.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
