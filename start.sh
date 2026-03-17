#!/bin/bash
set -e

echo ""
echo "======================================"
echo "  CSC AI Co-Pilot — Quick Start"
echo "======================================"
echo ""

# Check .env
if [ ! -f .env ]; then
  echo "📋 Creating .env from template..."
  cp .env.example .env
  echo ""
  echo "⚠️  ACTION REQUIRED: Edit .env and set your ANTHROPIC_API_KEY"
  echo "   Get your key at: https://console.anthropic.com"
  echo ""
  read -p "Press Enter after you've set the API key in .env..."
fi

# Check Node
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Install Node.js 18+ from https://nodejs.org"
  exit 1
fi

echo "📦 Installing backend dependencies..."
cd backend
cp .env.example .env 2>/dev/null || true
# Copy API key from root .env
grep "ANTHROPIC_API_KEY" ../.env >> .env 2>/dev/null || true
npm install --silent
echo "✅ Backend ready"

echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install --silent
echo "✅ Frontend ready"

cd ..

echo ""
echo "🚀 Starting CSC AI Co-Pilot..."
echo ""
echo "   Backend API  → http://localhost:5000"
echo "   Frontend App → http://localhost:3000"
echo ""
echo "   Press Ctrl+C to stop"
echo ""

# Start both
(cd backend && npm start) &
BACKEND_PID=$!

sleep 2

(cd frontend && BROWSER=none npm start) &
FRONTEND_PID=$!

wait $BACKEND_PID $FRONTEND_PID
