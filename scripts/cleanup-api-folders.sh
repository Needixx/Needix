#!/bin/bash

echo "🧹 Cleaning up duplicate API folders..."

# Check if both folders exist
if [ -d "app/api" ] && [ -d "app/api 2" ]; then
  echo "Found both app/api and app/api 2 folders"
  
  # Create backup
  mkdir -p temp-cleanup
  cp -r "app/api 2" temp-cleanup/
  
  echo "📋 Files in app/api:"
  ls -la app/api/
  
  echo "📋 Files in app/api 2:"
  ls -la "app/api 2/"
  
  echo "⚠️  You have duplicate API folders. Please manually review and merge them."
  echo "   1. Review the contents of both folders"
  echo "   2. Keep the most up-to-date files in app/api"
  echo "   3. Remove app/api 2 folder when done"
  echo "   4. Backup created in temp-cleanup/ just in case"
  
elif [ -d "app/api 2" ] && [ ! -d "app/api" ]; then
  echo "Moving app/api 2 to app/api..."
  mv "app/api 2" app/api
  echo "✅ Moved app/api 2 to app/api"
  
else
  echo "✅ API folder structure is clean"
fi
