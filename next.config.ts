import type { NextConfig } from "next";

const isMobileBuild = process.env.BUILD_TARGET === "mobile";

type WithResolve = {
  resolve?: { fallback?: Record<string, false | string> };
};

const nextConfig = {
  output: isMobileBuild ? "export" : undefined,

  images: { unoptimized: true },

  experimental: { optimizeCss: true },

  distDir: isMobileBuild ? "out" : ".next",

  assetPrefix: undefined,

  typescript: { ignoreBuildErrors: false },

  eslint: { ignoreDuringBuilds: false },

  trailingSlash: isMobileBuild,

  webpack: (config: unknown, ctx: { isServer: boolean }) => {
    const cfg = config as WithResolve;
    if (!ctx.isServer) {
      if (!cfg.resolve) cfg.resolve = {};
      cfg.resolve.fallback = {
        ...(cfg.resolve.fallback ?? {}),
        fs: false,
        net: false,
        tls: false,
      };
    }
    return cfg as unknown as object;
  },
} satisfies NextConfig;

export default nextConfig;
