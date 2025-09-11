// next.config.ts

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep API routes working for authentication
  // output: 'export', // Commented out to allow server-side features
  
  // Optimize for mobile and web
  images: {
    unoptimized: true
  },
  
  // Experimental features
  experimental: {
    optimizeCss: true
  },
  
  // Standard build directory
  distDir: '.next',
  
  // Ensure proper asset handling
  assetPrefix: undefined,
  
  // Enable TypeScript strict mode
  typescript: {
    ignoreBuildErrors: false
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false
  }
}

module.exports = nextConfig