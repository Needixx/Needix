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
    ignoreBuildErrors: false,
  },
  experimental: {
    // Only include valid experimental options here if needed
  },
  webpack: (config, { isServer }) => {
    // Handle missing math-intrinsics modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    // Handle math-intrinsics specifically
    config.resolve.alias = {
      ...config.resolve.alias,
      'math-intrinsics/abs': require.resolve('math-intrinsics/abs'),
      'math-intrinsics/floor': require.resolve('math-intrinsics/floor'),
      'math-intrinsics/max': require.resolve('math-intrinsics/max'),
      'math-intrinsics/min': require.resolve('math-intrinsics/min'),
      'math-intrinsics/pow': require.resolve('math-intrinsics/pow'),
    };

    return config;
  },
};

module.exports = nextConfig;