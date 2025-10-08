#!/bin/bash
# scripts/fix-capacitor-references.sh
# Replace Capacitor checks with web-only code

set -e

echo "🔧 Fixing Capacitor references..."

# Replace Capacitor.isNativePlatform() with false
find components/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i.bak 's/Capacitor\.isNativePlatform()/false/g' {} \;

# Replace Capacitor.getPlatform() with 'web'
find components/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i.bak "s/Capacitor\.getPlatform()/'web'/g" {} \;

# Remove backup files
find components/ lib/ -name "*.bak" -delete

echo "✅ Capacitor references fixed"
echo ""
echo "All Capacitor.isNativePlatform() → false"
echo "All Capacitor.getPlatform() → 'web'"
echo ""
echo "Next steps:"
echo "1. rm -rf .next"
echo "2. pnpm dev"