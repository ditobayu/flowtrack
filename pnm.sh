# Push and Merge Script
echo "Starting push to dev..."
git add .

echo "Committing changes..."
git commit -m "feat: auto commit"

echo "Pushing to dev branch..."
git push

#!/bin/bash

# Script to merge dev branch to main
echo "🚀 Starting merge process from dev to main..."

# Checkout main branch
echo "📥 Switching to main branch..."
git checkout main

# Pull latest changes from main
echo "🔄 Pulling latest changes from main..."
git pull origin main

# Merge dev branch into main
echo "🔀 Merging dev branch into main..."
git merge dev -m "merge dev into main"

# Push changes to main
echo "📤 Pushing changes to main..."
git push origin main

# Switch back to dev branch
echo "🔄 Switching back to dev branch..."
git checkout dev

echo "✅ Merge process completed successfully!"
