#!/bin/bash

# Upload script for Injapan Food to VPS
set -e

echo "🚀 Uploading Injapan Food to VPS..."

# Configuration - UPDATE THESE VALUES
VPS_IP="YOUR_VPS_IP"
VPS_USER="root"  # or "deployer"
DOMAIN="yourdomain.com"

# Check if build exists
if [ ! -f "injapan-food-build.tar.gz" ]; then
    echo "❌ Build file not found! Run ./build-for-production.sh first"
    exit 1
fi

echo "📤 Uploading files to VPS..."

# Upload build and deployment files
scp injapan-food-build.tar.gz ${VPS_USER}@${VPS_IP}:~/
scp deploy.sh server-setup.sh nginx.conf ${VPS_USER}@${VPS_IP}:~/

echo "🖥️ Setting up server..."

# Execute server setup and deployment on VPS
ssh ${VPS_USER}@${VPS_IP} << 'ENDSSH'
    # Make scripts executable
    chmod +x server-setup.sh deploy.sh
    
    # Run server setup (only needed once)
    echo "🔧 Running server setup..."
    ./server-setup.sh
    
    # Run deployment
    echo "🚀 Deploying application..."
    ./deploy.sh
    
    # Extract build to web directory
    echo "📦 Extracting build files..."
    cd /var/www/injapan-food
    tar -xzf ~/injapan-food-build.tar.gz --strip-components=1
    
    # Set correct permissions
    sudo chown -R www-data:www-data /var/www/injapan-food
    sudo chmod -R 755 /var/www/injapan-food
    
    # Test nginx configuration
    sudo nginx -t
    sudo systemctl reload nginx
    
    echo "✅ Deployment completed!"
ENDSSH

echo "🎉 Upload and deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Update DNS to point ${DOMAIN} to ${VPS_IP}"
echo "2. Setup SSL: ssh ${VPS_USER}@${VPS_IP} 'sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}'"
echo "3. Test your website at: https://${DOMAIN}"
echo ""
echo "🔧 To customize:"
echo "- Edit VPS_IP, VPS_USER, and DOMAIN in this script"
echo "- Update domain in nginx.conf before running"
