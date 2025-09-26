// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove output: 'export' for now - we'll handle this differently
  // output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    // Remove the invalid config option
  },
  // Add runtime configuration
  serverRuntimeConfig: {
    // Will only be available on the server side
  },
  publicRuntimeConfig: {
    // Will be available on both server and client side
  },
};

module.exports = nextConfig;