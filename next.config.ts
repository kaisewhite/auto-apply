import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Set output to export for static generation
  output: "export",
  // Disable image optimization during export
  images: {
    unoptimized: true,
  },
  // Skip API routes when building as static export
  typescript: {
    // Ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
