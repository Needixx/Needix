// next.config.ts

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizeCss: true,
  },
  // For Capacitor, we'll use regular build (not static export)
  // and point to the .next output
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};

export default nextConfig;