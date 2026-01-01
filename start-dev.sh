#!/bin/bash

# Force stop any process on port 3000 and start Next.js on port 3000
echo "🛑 Stopping any process on port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "Port 3000 is free"

echo "🚀 Starting Next.js on port 3000..."
next dev -p 3000

