#!/bin/bash
# scripts/fast-push.sh
# Ultra-fast commit and push (no questions asked)

# Usage: ./scripts/fast-push.sh "Your commit message"
# Or:    ./scripts/fast-push.sh  (uses default message)

COMMIT_MSG="${1:-Update: $(date +%Y-%m-%d\ %H:%M)}"

echo "⚡ Fast Push: $COMMIT_MSG"

# Stage files
git add .gitignore "*.ts" "*.tsx" "*.json" "*.md" app/ components/ lib/ prisma/ scripts/ public/ 2>/dev/null || true

# Check if there's anything to commit
if git diff --cached --quiet; then
  echo "✅ No changes to commit"
  exit 0
fi

# Commit and push in one go
git commit -m "$COMMIT_MSG" --no-verify && git push

if [ $? -eq 0 ]; then
  echo "✅ Pushed successfully!"
else
  echo "❌ Push failed - check output above"
  exit 1
fi