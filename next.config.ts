// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export for now to keep API routes working
  // output: 'export',
  
  // Optimize for mobile
  images: {
    unoptimized: true
  },
  
  // Experimental features
  experimental: {
    optimizeCss: true
  },
  
  // Build directory
  distDir: '.next'
}

module.exports = nextConfig