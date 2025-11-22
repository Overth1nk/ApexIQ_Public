#!/bin/bash
# Script to update public repo cleanly

PUBLIC_REPO_URL="https://github.com/Overth1nk/ApexIQ_Public.git"
TEMP_DIR="/tmp/apexiq_update_script"

echo "🧹 Cleaning up temp directory..."
rm -rf $TEMP_DIR

echo "📥 Cloning public repository..."
git clone $PUBLIC_REPO_URL $TEMP_DIR

echo "🔄 Syncing files..."
rsync -av --exclude='.git' --exclude='node_modules' --exclude='.next' --exclude='.env.local' --exclude='.venv' --exclude='.DS_Store' . $TEMP_DIR/

echo "💾 Committing and pushing..."
cd $TEMP_DIR
git add .
git commit -m "Update: Latest changes from development"
git push origin main

echo "✅ Public repository updated successfully!"
