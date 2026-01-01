#!/bin/bash

# Setup script for GitHub Codespaces
# Run this in your Codespaces terminal: bash setup-codespace.sh

echo "🚀 Setting up Stream Party in Codespaces..."

# Navigate to project directory
cd stream-party || exit

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start the development server
echo "✨ Starting development server..."
echo "The server will run on port 3000"
echo "Make sure port 3000 is forwarded in the Ports tab!"
npm run dev

