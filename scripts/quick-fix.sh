#!/bin/bash
# quick-fix.sh - Add debug imports to files

# Files that need debug import
files=(
  "app/api/admin/analytics/route.ts"
  "app/api/create-checkout-session/route.ts"
  "app/api/create-portal-session/route.ts"
  "app/api/cron/notifications/route.ts"
  "app/api/push/subscribe/route.ts"
  "lib/auth.ts"
  "lib/migrateEssentialStatus.ts"
  "lib/notifications/NotificationService.ts"
  "lib/notifications/pushNotifications.ts"
  "lib/offline-storage.ts"
  "scripts/fix-users.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    # Check if import already exists
    if ! grep -q "import { debug }" "$file"; then
      # Add import after the last import line
      sed -i.bak '/^import /a\
import { debug } from '\''@/lib/debug'\'';
' "$file"
      echo "Added debug import to $file"
    else
      echo "Debug import already exists in $file"
    fi
  else
    echo "File not found: $file"
  fi
done

# Fix the dashboard page type issue
if [ -f "app/dashboard/page.tsx" ]; then
  sed -i.bak 's/o\.type === "recurring"/o.type === "subscription"/g' "app/dashboard/page.tsx"
  echo "Fixed type issue in app/dashboard/page.tsx"
fi

echo "Quick fixes completed!"