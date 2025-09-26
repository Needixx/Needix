#!/bin/bash

echo "🔧 Building Needix for mobile..."

# Create temp directory if it doesn't exist
mkdir -p temp-mobile-build

echo "📝 Creating mobile-specific next.config.js..."

# Create mobile-specific config
cat > next.config.mobile.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
EOF

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

# Backup current next.config.js
if [ -f "next.config.js" ]; then
  mv next.config.js temp-mobile-build/next.config.backup.js
  echo "Backed up next.config.js"
fi

# Use mobile config
mv next.config.mobile.js next.config.js
echo "Using mobile-specific config"

echo "🏗️ Building static export..."

# Build the static export
if npm run build; then
  echo "✅ Build successful!"
else
  echo "❌ Build failed!"
  exit 1
fi

echo "📁 Restoring files..."

# Restore original next.config.js
if [ -f "temp-mobile-build/next.config.backup.js" ]; then
  mv temp-mobile-build/next.config.backup.js next.config.js
  echo "Restored original next.config.js"
else
  rm -f next.config.js
fi

# Restore API routes
if [ -d "temp-mobile-build/api-backup" ]; then
  mv temp-mobile-build/api-backup app/api
  echo "Restored app/api from backup"
fi

if [ -d "temp-mobile-build/api-2-backup" ]; then
  mv temp-mobile-build/api-2-backup "app/api 2"
  echo "Restored app/api 2 from backup"
fi

echo "✅ Mobile build complete!"
echo "📱 Run 'npx cap sync' to sync with native projects"// scripts/build-mobile.sh
#!/bin/bash

echo "🔧 Building Needix for mobile..."

# Create temp directory if it doesn't exist
mkdir -p temp-mobile-build

echo "📝 Creating mobile-specific next.config.js..."

# Create mobile-specific config
cat > next.config.mobile.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
EOF

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

# Backup current next.config.js
if [ -f "next.config.js" ]; then
  mv next.config.js temp-mobile-build/next.config.backup.js
  echo "Backed up next.config.js"
fi

# Use mobile config
mv next.config.mobile.js next.config.js
echo "Using mobile-specific config"

echo "🏗️ Building static export..."

# Build the static export
if npm run build; then
  echo "✅ Build successful!"
else
  echo "❌ Build failed!"
  exit 1
fi

echo "📁 Restoring files..."

# Restore original next.config.js
if [ -f "temp-mobile-build/next.config.backup.js" ]; then
  mv temp-mobile-build/next.config.backup.js next.config.js
  echo "Restored original next.config.js"
else
  rm -f next.config.js
fi

# Restore API routes
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