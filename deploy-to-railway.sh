#!/bin/bash

set -e

echo "=========================================="
echo "Railway Health Webhook Deployment Script"
echo "=========================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found!"
    echo ""
    echo "Please install Railway CLI:"
    echo "  npm install -g @railway/cli"
    echo ""
    echo "Then login:"
    echo "  railway login"
    echo ""
    exit 1
fi

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📝 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit: Railway Health Webhook Server"
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Check if remote is set
if ! git remote get-url origin &> /dev/null; then
    echo ""
    echo "⚠️  No Git remote configured!"
    echo ""
    echo "Please create a GitHub repository and run:"
    echo "  git remote add origin <your-github-repo-url>"
    echo "  git push -u origin main"
    echo ""
    echo "Then re-run this script."
    exit 1
fi

# Check if Railway project exists
echo ""
echo "🔍 Checking Railway project status..."
if railway project &> /dev/null; then
    echo "✅ Already linked to a Railway project"
else
    echo ""
    echo "⚠️  Not linked to a Railway project!"
    echo ""
    echo "Creating a new Railway project..."
    railway init
    echo "✅ Railway project created"
fi

# Generate API key if not exists
if [ ! -f .env ]; then
    echo ""
    echo "🔑 Generating secure API key..."
    API_KEY=$(openssl rand -base64 32)
    echo "API_KEY=$API_KEY" > .env

    echo ""
    echo "🔑 Your API Key: $API_KEY"
    echo "⚠️  Please save this key! You'll need it for iOS Shortcuts."
    echo ""

    # Prompt for OpenClaw webhook URL
    read -p "Enter your OpenClaw webhook URL (default: http://localhost:8080/webhook/health-data): " WEBHOOK_URL
    WEBHOOK_URL=${WEBHOOK_URL:-http://localhost:8080/webhook/health-data}
    echo "OPENCLAW_WEBHOOK_URL=$WEBHOOK_URL" >> .env

    echo ""
    echo "✅ .env file created with configuration"
else
    echo "✅ .env file already exists"
fi

# Deploy to Railway
echo ""
echo "🚀 Deploying to Railway..."
railway up

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Set environment variables in Railway dashboard:"
echo "   - Login to https://railway.app"
echo "   - Select your project"
echo "   - Go to Variables tab"
echo "   - Add the following:"
echo "     API_KEY=$(grep API_KEY .env | cut -d'=' -f2)"
echo "     OPENCLAW_WEBHOOK_URL=$(grep OPENCLAW_WEBHOOK_URL .env | cut -d'=' -f2)"
echo ""
echo "2. Get your Railway project URL:"
echo "   railway domain"
echo ""
echo "3. Test your webhook:"
echo "   curl -X POST <your-railway-url>/webhook/health \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -H \"X-API-Key: $(grep API_KEY .env | cut -d'=' -f2)\" \\"
echo "     -d '{\"data\":{\"heartRate\":68,\"sleepDuration\":7.5,\"steps\":4500,\"timestamp\":\"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'\"},\"trigger\":\"morning-report\"}'"
echo ""
echo "4. Configure your iOS Shortcuts with:"
echo "   URL: <your-railway-url>/webhook/health"
echo "   Header: X-API-Key: $(grep API_KEY .env | cut -d'=' -f2)"
echo ""
