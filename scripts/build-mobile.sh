#!/bin/bash
# scripts/build-mobile.sh

set -e

cleanup() {
  echo "📁 Cleaning up..."
  git checkout app/api 2>/dev/null || echo "API folder already present"
  git checkout next.config.js 2>/dev/null || true
  rm -f next.config.mobile.js
  echo "✓ Cleanup complete"
}

trap cleanup EXIT

echo "🔧 Building Needix for mobile (Production Mode)..."

# CRITICAL: Clean all build artifacts first
echo "🧹 Cleaning build artifacts..."
rm -rf .next
rm -rf out
rm -rf app/api-temp-hidden
rm -rf "app/api-2-temp-hidden"

# Create mobile config
cat > next.config.mobile.js << 'CONFIGEOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  trailingSlash: true,
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  compress: true,
  poweredByHeader: false,
};
module.exports = nextConfig;
CONFIGEOF

# Remove API folders
rm -rf app/api
rm -rf "app/api 2"

# Swap config
cp next.config.js next.config.backup.js 2>/dev/null || true
cp next.config.mobile.js next.config.js

echo "🏗️ Building static export..."

if npm run build; then
  echo "✅ Build successful!"
  echo "📱 Run 'npx cap sync ios' next"
else
  echo "❌ Build failed!"
  exit 1
fi
