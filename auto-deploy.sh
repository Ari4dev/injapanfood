#!/bin/bash

# Auto deployment script for Injapan Food
# This script will be triggered by GitHub Actions or webhook

set -e

echo "🚀 Starting auto deployment..."

# Variables
APP_NAME="injapan-food"
APP_DIR="/var/www/$APP_NAME"
BACKUP_DIR="/var/backups/$APP_NAME"
DOMAIN="injapanfood.com"

# Create backup
echo "💾 Creating backup..."
sudo mkdir -p $BACKUP_DIR
BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
sudo cp -r $APP_DIR $BACKUP_DIR/$BACKUP_NAME

# Navigate to project directory
cd $APP_DIR

# Pull latest changes from GitHub
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Build project
echo "🔨 Building project..."
npm run build

# Set correct permissions
echo "🔐 Setting permissions..."
sudo chown -R www-data:www-data $APP_DIR
sudo chmod -R 755 $APP_DIR

# Test nginx configuration
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

# Reload nginx
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

# Clean old backups (keep last 5)
echo "🧹 Cleaning old backups..."
find $BACKUP_DIR -name "backup-*" -type d | sort -r | tail -n +6 | sudo xargs rm -rf

echo "✅ Auto deployment completed successfully!"
echo "🌐 Your site should be updated at: https://$DOMAIN"

# Optional: Send notification (uncomment if you want Slack/Discord notifications)
# curl -X POST -H 'Content-type: application/json' \
#   --data '{"text":"🚀 Injapan Food deployed successfully!"}' \
#   YOUR_WEBHOOK_URL
