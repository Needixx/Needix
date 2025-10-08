#!/bin/bash
# scripts/safe-git-commit.sh
# Safely stage, commit, and push changes to GitHub

set -e

echo "🔍 Checking git status..."
echo ""

# First, let's see what git thinks needs to be added
echo "📊 Checking for large files and folders..."

# Check if node_modules is being tracked (it shouldn't be)
if git ls-files | grep -q "node_modules/"; then
  echo "❌ WARNING: node_modules/ is being tracked by git!"
  echo "   This should be ignored. Fixing..."
  git rm -r --cached node_modules/ 2>/dev/null || true
fi

# Check if .next is being tracked (it shouldn't be)
if git ls-files | grep -q ".next/"; then
  echo "❌ WARNING: .next/ is being tracked by git!"
  echo "   This should be ignored. Fixing..."
  git rm -r --cached .next/ 2>/dev/null || true
fi

# Check if temp folders are being tracked
if git ls-files | grep -q "temp-"; then
  echo "⚠️  WARNING: temp- folders are being tracked!"
  echo "   These should be ignored. Fixing..."
  git rm -r --cached temp-* 2>/dev/null || true
fi

# Show what's changed (but limit output)
echo ""
echo "📝 Changed files:"
git status --short | head -20
echo ""

# Count total changes
TOTAL_CHANGES=$(git status --short | wc -l | tr -d ' ')
echo "Total changed files: $TOTAL_CHANGES"

if [ "$TOTAL_CHANGES" -gt 100 ]; then
  echo ""
  echo "⚠️  You have $TOTAL_CHANGES changed files."
  echo "   This is a lot - are you sure node_modules/ is in .gitignore?"
  echo ""
  read -p "Continue anyway? (y/N): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
  fi
fi

echo ""
echo "➕ Staging changes..."

# Stage in batches to avoid hanging
git add .gitignore 2>/dev/null || true
git add "*.ts" "*.tsx" "*.js" "*.jsx" 2>/dev/null || true
git add "*.json" "*.md" "*.txt" 2>/dev/null || true
git add "*.css" "*.scss" 2>/dev/null || true
git add app/ components/ lib/ 2>/dev/null || true
git add prisma/ 2>/dev/null || true
git add public/ 2>/dev/null || true

# Add scripts folder
git add scripts/ 2>/dev/null || true

echo "✅ Changes staged"
echo ""

# Show what will be committed
echo "📋 Files staged for commit:"
git status --short | grep "^[AM]" | head -20
echo ""

# Ask for commit message
echo "💬 Enter commit message (or press Enter for default):"
read -p "> " COMMIT_MSG

if [ -z "$COMMIT_MSG" ]; then
  COMMIT_MSG="Update: $(date +%Y-%m-%d)"
  echo "Using default message: $COMMIT_MSG"
fi

echo ""
echo "📝 Committing changes..."
git commit -m "$COMMIT_MSG"

echo "✅ Changes committed"
echo ""

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"
echo ""

# Ask about pushing
read -p "🚀 Push to GitHub? (Y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Nn]$ ]]; then
  echo "✅ Changes committed locally (not pushed)"
  echo "   Run 'git push' when ready to push to GitHub"
  exit 0
fi

echo "🚀 Pushing to GitHub..."

# Try to push
if git push origin "$CURRENT_BRANCH"; then
  echo ""
  echo "✅ Successfully pushed to GitHub!"
  echo "   Branch: $CURRENT_BRANCH"
else
  echo ""
  echo "❌ Push failed. You may need to:"
  echo "   1. Set up remote: git remote add origin <your-repo-url>"
  echo "   2. Set upstream: git push -u origin $CURRENT_BRANCH"
  echo "   3. Pull first if remote has changes: git pull origin $CURRENT_BRANCH"
  echo ""
  echo "Current remotes:"
  git remote -v
fi