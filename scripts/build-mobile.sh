#!/bin/bash

echo "🔧 Building Needix for mobile..."

# Create temp directory if it doesn't exist
mkdir -p temp-mobile-build

echo "📁 Temporarily hiding API routes..."

# Hide both API folders
if [ -d "app/api" ]; then
  mv app/api temp-mobile-build/api-backup
  echo "Moved app/api to temp-mobile-build/api-backup"
fi

if [ -d "app/api 2" ]; then
  mv "app/api 2" temp-mobile-build/api-2-backup
  echo "Moved app/api 2 to temp-mobile-build/api-2-backup"
fi

echo "🏗️ Building static export..."

# Build the static export
if npm run build; then
  echo "✅ Build successful!"
else
  echo "❌ Build failed!"
  
  echo "📁 Restoring API routes..."
  
  # Restore API routes on failure
  if [ -d "temp-mobile-build/api-backup" ]; then
    mv temp-mobile-build/api-backup app/api
    echo "Restored app/api from backup"
  fi
  
  if [ -d "temp-mobile-build/api-2-backup" ]; then
    mv temp-mobile-build/api-2-backup "app/api 2"
    echo "Restored app/api 2 from backup"
  fi
  
  exit 1
fi

echo "📁 Restoring API routes..."

# Restore API routes on success
if [ -d "temp-mobile-build/api-backup" ]; then
  mv temp-mobile-build/api-backup app/api
  echo "Restored app/api from backup"
fi

if [ -d "temp-mobile-build/api-2-backup" ]; then
  mv temp-mobile-build/api-2-backup "app/api 2"
  echo "Restored app/api 2 from backup"
fi

echo "✅ Mobile build complete!"
echo "📱 Run 'npx cap sync' to sync with native projects"