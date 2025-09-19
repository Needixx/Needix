// next.config.ts

import type { NextConfig } from 'next';

const isMobileBuild = process.env.BUILD_TARGET === 'mobile';

const nextConfig: NextConfig = {
  // For mobile builds, we need static export
  output: isMobileBuild ? 'export' : undefined,
  
  // Disable image optimization for static export
  images: {
    unoptimized: true
  },
  
  // Experimental features
  experimental: {
    optimizeCss: true
  },
  
  // For static export, use 'out' directory
  distDir: isMobileBuild ? 'out' : '.next',
  
  // Ensure proper asset handling
  assetPrefix: undefined,
  
  // Enable TypeScript strict mode
  typescript: {
    ignoreBuildErrors: false
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false
  },
  
  // Trailing slash for static export compatibility
  trailingSlash: isMobileBuild,
  
  // Webpack configuration for mobile compatibility
  webpack: (config, { dev, isServer }) => {
    // Handle capacitor imports
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;