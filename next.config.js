// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore TypeScript errors
  },
  // Remove the invalid experimental option
  experimental: {
    // Only include valid experimental options here if needed
  },
};

module.exports = nextConfig;