#!/bin/bash
# scripts/remove-capacitor-imports.sh
# Remove or comment out Capacitor imports

set -e

echo "🧹 Removing Capacitor dependencies from code..."

# Delete mobile-only files
echo "Deleting mobile-only files..."
rm -f components/NativeCleanup.tsx
rm -f components/MobileAuthProvider.tsx
rm -f lib/mobile-simple-auth.ts
rm -f lib/mobile-auth.ts
rm -f lib/useMobileStorage.ts
rm -f lib/offline-storage.ts

# Comment out Capacitor imports in remaining files
echo "Commenting out Capacitor imports in shared files..."

# Function to comment out Capacitor imports
comment_capacitor() {
  local file=$1
  if [ -f "$file" ]; then
    echo "  Processing $file..."
    # Comment out any line that imports from @capacitor
    sed -i.bak "s/^import.*@capacitor.*$/\/\/ &/" "$file"
    rm "${file}.bak" 2>/dev/null || true
  fi
}

# Process each file
comment_capacitor "components/auth/SignInForm.tsx"
comment_capacitor "components/ClientSignInForm.tsx"
comment_capacitor "components/ClientLayoutWrapper.tsx"
comment_capacitor "lib/useReminders.ts"
comment_capacitor "lib/useSubscriptions.ts"
comment_capacitor "lib/useExpenses.ts"
comment_capacitor "lib/useOrders.ts"
comment_capacitor "lib/notifications/NotificationService.ts"
comment_capacitor "lib/auth.ts"

echo ""
echo "✅ Capacitor imports removed/commented out"
echo ""
echo "⚠️  WARNING: Some files may have broken functionality that depended on Capacitor."
echo "   You may need to remove Capacitor-specific code blocks manually."
echo ""
echo "Next steps:"
echo "1. Review the commented-out imports"
echo "2. Remove any Capacitor-specific code blocks (like if (Capacitor.isNativePlatform()))"
echo "3. rm -rf .next"
echo "4. pnpm dev"
