#!/bin/bash

# scripts/create-notification-icons.sh
# This script creates basic notification icons for your app

echo "Creating notification icons..."

# Create the icons directory
mkdir -p public/icons

# Create a simple SVG and convert it to different sizes
# You can replace these with actual PNG files later

cat > public/icons/icon-192.png.svg << 'EOF'
<svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
  <rect width="192" height="192" fill="#6366f1" rx="24"/>
  <circle cx="96" cy="96" r="48" fill="white"/>
  <path d="M96 60v72M60 96h72" stroke="#6366f1" stroke-width="8" stroke-linecap="round"/>
</svg>
EOF

cat > public/icons/icon-512.png.svg << 'EOF'
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#6366f1" rx="64"/>
  <circle cx="256" cy="256" r="128" fill="white"/>
  <path d="M256 128v256M128 256h256" stroke="#6366f1" stroke-width="16" stroke-linecap="round"/>
</svg>
EOF

cat > public/icons/badge-72.png.svg << 'EOF'
<svg width="72" height="72" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
  <circle cx="36" cy="36" r="36" fill="#ef4444"/>
  <text x="36" y="48" text-anchor="middle" fill="white" font-family="sans-serif" font-size="32" font-weight="bold">!</text>
</svg>
EOF

cat > public/icons/subscription.png.svg << 'EOF'
<svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
  <rect width="192" height="192" fill="#10b981" rx="24"/>
  <rect x="32" y="48" width="128" height="96" fill="white" rx="8"/>
  <circle cx="64" cy="80" r="8" fill="#10b981"/>
  <rect x="80" y="72" width="64" height="16" fill="#d1d5db" rx="2"/>
  <rect x="48" y="112" width="96" height="8" fill="#d1d5db" rx="2"/>
</svg>
EOF

echo "✅ Created SVG placeholders for notification icons"
echo "📝 Note: These are SVG files with .png extensions for compatibility"
echo "🎨 Replace these with actual PNG files for better browser support"

# If you have ImageMagick installed, uncomment these lines to convert to PNG
# convert public/icons/icon-192.png.svg public/icons/icon-192.png
# convert public/icons/icon-512.png.svg public/icons/icon-512.png  
# convert public/icons/badge-72.png.svg public/icons/badge-72.png
# convert public/icons/subscription.png.svg public/icons/subscription.png