#!/bin/bash
# scripts/consolidate-api-folders.sh
# Safely merge app/api 2 into app/api

set -e

echo "🔍 Consolidating API folders..."
echo ""

# Check if both folders exist
if [ ! -d "app/api 2" ]; then
  echo "✅ No 'app/api 2' folder found - nothing to consolidate"
  exit 0
fi

# Create backup first
echo "📦 Creating backup..."
BACKUP_DIR="temp-api-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r app/api "$BACKUP_DIR/api-original" 2>/dev/null || echo "No app/api to backup"
cp -r "app/api 2" "$BACKUP_DIR/api-2-original"
echo "✅ Backup created in $BACKUP_DIR"
echo ""

# List files in both directories
echo "📋 Files in app/api:"
find app/api -type f -name "*.ts" 2>/dev/null | sort || echo "  (empty)"
echo ""

echo "📋 Files in app/api 2:"
find "app/api 2" -type f -name "*.ts" | sort
echo ""

# Copy all files from "app/api 2" to "app/api", overwriting
echo "🔄 Copying files from 'app/api 2' to 'app/api'..."

# Create app/api if it doesn't exist
mkdir -p app/api

# Copy everything from "app/api 2" to "app/api"
# Using rsync for better handling of spaces in folder names
if command -v rsync &> /dev/null; then
  rsync -av "app/api 2/" app/api/
else
  # Fallback to cp if rsync not available
  cp -r "app/api 2/"* app/api/ 2>/dev/null || true
fi

echo "✅ Files copied"
echo ""

# Show what's now in app/api
echo "📋 Consolidated app/api structure:"
find app/api -type f -name "*.ts" | sort
echo ""

# Ask for confirmation before deleting
echo "⚠️  Ready to delete 'app/api 2' folder"
echo "   Backup is in: $BACKUP_DIR"
echo ""
read -p "Delete 'app/api 2' folder? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  rm -rf "app/api 2"
  echo "✅ Deleted 'app/api 2' folder"
else
  echo "⏸️  Keeping 'app/api 2' folder for now"
  echo "   You can manually delete it later with: rm -rf 'app/api 2'"
fi

echo ""
echo "✅ Consolidation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Stop your dev server (Ctrl+C if running)"
echo "2. Delete build cache: rm -rf .next"
echo "3. Restart dev server: pnpm dev"
echo "4. Test these routes:"
echo "   - http://localhost:3000/api/test"
echo "   - http://localhost:3000/api/transactions/import"
echo "   - http://localhost:3000/api/integrations/plaid/transactions"
echo ""
echo "If something goes wrong, restore from backup:"
echo "   cp -r $BACKUP_DIR/api-2-original 'app/api 2'"
echo "   cp -r $BACKUP_DIR/api-original app/api"