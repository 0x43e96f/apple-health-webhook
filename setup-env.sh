#!/bin/bash

set -e

echo "=========================================="
echo "Generate API Key and Setup .env"
echo "=========================================="
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists!"
    echo ""
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled"
        exit 1
    fi
fi

# Generate secure API key
echo "🔑 Generating secure API key..."
API_KEY=$(openssl rand -base64 32)
echo "✅ API key generated"
echo ""

# Save API key
echo "API_KEY=$API_KEY" > .env

# Prompt for OpenClaw webhook URL
echo ""
read -p "Enter your OpenClaw webhook URL (default: http://localhost:8080/webhook/health-data): " WEBHOOK_URL
WEBHOOK_URL=${WEBHOOK_URL:-http://localhost:8080/webhook/health-data}
echo "OPENCLAW_WEBHOOK_URL=$WEBHOOK_URL" >> .env

# Add port
echo "PORT=8080" >> .env

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "📝 Your configuration:"
echo ""
echo "API Key: $API_KEY"
echo "OpenClaw Webhook URL: $WEBHOOK_URL"
echo ""
echo "⚠️  IMPORTANT: Please save your API key securely!"
echo "   You'll need it for iOS Shortcuts configuration."
echo ""
echo "📄 .env file created successfully"
echo ""
