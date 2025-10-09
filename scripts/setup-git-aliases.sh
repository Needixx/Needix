#!/bin/bash
# scripts/setup-git-aliases.sh
# Create helpful git aliases for this project

echo "🔧 Setting up Git aliases..."
echo ""

# Create aliases
git config alias.s "status --short"
git config alias.quick "!f() { git add .gitignore '*.ts' '*.tsx' '*.json' '*.md' app/ components/ lib/ prisma/ scripts/ public/ && git commit -m \"\${1:-Update: $(date +%Y-%m-%d)}\" --no-verify && git push; }; f"
git config alias.fastpush "!git add .gitignore '*.ts' '*.tsx' '*.json' '*.md' app/ components/ lib/ prisma/ scripts/ public/ && git commit -m 'Update' --no-verify && git push"
git config alias.undo "reset --soft HEAD~1"

echo "✅ Aliases created!"
echo ""
echo "Available commands:"
echo ""
echo "  git s               # Short status"
echo "  git quick 'msg'     # Quick commit and push with message"
echo "  git quick           # Quick commit and push with auto message"
echo "  git fastpush        # Super fast push (no message needed)"
echo "  git undo            # Undo last commit (keeps changes)"
echo ""
echo "Examples:"
echo "  git quick 'Fixed bug'"
echo "  git fastpush"
echo "  git s"