#!/bin/bash

# Setup script for Clerk environment variables in Codespaces
# Run this in your Codespaces terminal: bash setup-env.sh

echo "🔐 Setting up Clerk environment variables..."

# Create .env.local file with Clerk keys
cat > .env.local << 'EOF'
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_dW5pdGVkLWJ1Zy04Mi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_Hq1E2sd8RFMLlm1sGV6Sjob61cutyJ6TE5R5p67OW9
EOF

echo "✅ Environment variables created in .env.local"
echo ""
echo "📋 Verifying file contents:"
cat .env.local
echo ""
echo "🚀 Starting development server..."
echo "   (Press Ctrl+C to stop)"
echo ""

npm run dev

