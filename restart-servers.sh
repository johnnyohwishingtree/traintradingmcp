#!/bin/bash

# Script to restart frontend and backend servers
# Usage: ./restart-servers.sh

echo "🔄 Restarting frontend and backend servers..."

# Kill existing processes
echo "🛑 Stopping existing servers..."

# Find and kill node processes running on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "  ✓ Frontend server stopped" || echo "  ℹ No frontend server running"

# Find and kill node processes running on port 3001 (backend)
lsof -ti:3001 | xargs kill -9 2>/dev/null && echo "  ✓ Backend server stopped" || echo "  ℹ No backend server running"

# Wait for ports to be released
sleep 2

# Build the library
echo "🔨 Building financial-charts library..."
cd /Users/johnnyhuang/personal/traintradingmcp/financial-charts
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Library build failed!"
    exit 1
fi

# Re-link the library
echo "🔗 Linking library to standalone app..."
cd /Users/johnnyhuang/personal/traintradingmcp/standalone-chart
npm link ../financial-charts

# Start backend server
echo "🚀 Starting backend server..."
cd /Users/johnnyhuang/personal/traintradingmcp/standalone-chart/backend
node server.js &
BACKEND_PID=$!
echo "  ✓ Backend started (PID: $BACKEND_PID)"

# Start frontend server
echo "🚀 Starting frontend server..."
cd /Users/johnnyhuang/personal/traintradingmcp/standalone-chart
NODE_OPTIONS='--openssl-legacy-provider' npm start &
FRONTEND_PID=$!
echo "  ✓ Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "✅ Servers restarted successfully!"
echo "   Frontend: http://localhost:3000"
echo "   Backend: http://localhost:3001"
echo ""
echo "📝 Process IDs:"
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "To stop servers later, run:"
echo "   lsof -ti:3000 | xargs kill -9"
echo "   lsof -ti:3001 | xargs kill -9"
