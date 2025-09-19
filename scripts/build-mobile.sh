#!/bin/bash
# scripts/build-mobile.sh

echo "🔧 Building Needix for mobile..."

# Create temp directory and move API routes completely outside the app folder
echo "📁 Temporarily hiding API routes..."
if [ -d "app/api" ]; then
  mkdir -p temp-mobile-build
  mv app/api temp-mobile-build/api-backup
  echo "   Moved app/api to temp-mobile-build/api-backup"
fi

# Build static export
echo "🏗️ Building static export..."
if BUILD_TARGET=mobile npm run build; then
  echo "✅ Build succeeded!"
else
  echo "❌ Build failed!"
  # Restore API routes even if build failed
  echo "📁 Restoring API routes..."
  if [ -d "temp-mobile-build/api-backup" ]; then
    mv temp-mobile-build/api-backup app/api
    echo "   Restored app/api from backup"
  fi
  rmdir temp-mobile-build 2>/dev/null || true
  echo "✅ Mobile build complete!"
  echo "📱 Run 'npx cap sync' to sync with native projects"
  exit 1
fi

# Restore API routes
echo "📁 Restoring API routes..."
if [ -d "temp-mobile-build/api-backup" ]; then
  mv temp-mobile-build/api-backup app/api
  echo "   Restored app/api from backup"
fi
rmdir temp-mobile-build 2>/dev/null || true

echo "✅ Mobile build complete!"
echo "📱 Run 'npx cap sync' to sync with native projects"