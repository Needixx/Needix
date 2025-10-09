#!/bin/bash
# scripts/quick-commit.sh
# Fast git commit without hooks

set -e

echo "🚀 Quick Commit Tool"
echo "===================="
echo ""

# Check if we're in a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "❌ Not in a git repository!"
  exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
  echo "📝 Uncommitted changes detected"
else
  echo "✅ No changes to commit"
  exit 0
fi

echo ""
echo "📋 Files to be staged:"
echo ""

# Stage specific folders and file types (not everything!)
echo "   • .gitignore"
git add .gitignore 2>/dev/null || true

echo "   • TypeScript files (*.ts, *.tsx)"
git add "*.ts" "*.tsx" 2>/dev/null || true

echo "   • JSON files (*.json)"
git add "*.json" 2>/dev/null || true

echo "   • Markdown files (*.md)"
git add "*.md" 2>/dev/null || true

echo "   • app/ folder"
git add app/ 2>/dev/null || true

echo "   • components/ folder"
git add components/ 2>/dev/null || true

echo "   • lib/ folder"
git add lib/ 2>/dev/null || true

echo "   • prisma/ folder"
git add prisma/ 2>/dev/null || true

echo "   • scripts/ folder"
git add scripts/ 2>/dev/null || true

echo "   • public/ folder"
git add public/ 2>/dev/null || true

echo ""
echo "✅ Files staged"
echo ""

# Show what's staged
STAGED_COUNT=$(git diff --cached --name-only | wc -l | tr -d ' ')
echo "📊 Total files staged: $STAGED_COUNT"

if [ "$STAGED_COUNT" -eq 0 ]; then
  echo "⚠️  No files staged. Nothing to commit."
  exit 0
fi

echo ""
echo "Changed files:"
git diff --cached --name-only | head -20

if [ "$STAGED_COUNT" -gt 20 ]; then
  echo "... and $((STAGED_COUNT - 20)) more files"
fi

echo ""

# Get commit message from argument or ask for it
if [ -n "$1" ]; then
  COMMIT_MSG="$1"
  echo "💬 Commit message: $COMMIT_MSG"
else
  echo "💬 Enter commit message (or press Enter for default):"
  read -p "> " COMMIT_MSG
  
  if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="Update: $(date +%Y-%m-%d\ %H:%M)"
    echo "Using default: $COMMIT_MSG"
  fi
fi

echo ""
echo "📝 Committing (skipping hooks for speed)..."

# Commit without running hooks (--no-verify)
git commit -m "$COMMIT_MSG" --no-verify

echo "✅ Committed successfully"
echo ""

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"
echo ""

# Ask about pushing
read -p "🚀 Push to GitHub? (Y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Nn]$ ]]; then
  echo "✅ Changes committed locally"
  echo "   Run 'git push' when ready to push"
  exit 0
fi

echo "🚀 Pushing to GitHub..."

# Push
if git push origin "$CURRENT_BRANCH" 2>&1; then
  echo ""
  echo "✅ Successfully pushed to GitHub!"
  echo "   Branch: $CURRENT_BRANCH"
  echo "   View at: https://github.com/<your-username>/<your-repo>/tree/$CURRENT_BRANCH"
else
  EXIT_CODE=$?
  echo ""
  echo "⚠️  Push failed with exit code $EXIT_CODE"
  echo ""
  echo "Common fixes:"
  echo "   • First push: git push -u origin $CURRENT_BRANCH"
  echo "   • Behind remote: git pull origin $CURRENT_BRANCH"
  echo "   • Check remote: git remote -v"
  exit $EXIT_CODE
fi