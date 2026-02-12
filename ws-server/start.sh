#!/bin/bash

# Start Snapper Voice WebSocket Server
cd "$(dirname "$0")"

# Check if already running
if lsof -Pi :18791 -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ Server already running on port 18791"
    exit 1
fi

# Create logs directory
mkdir -p logs

# Start server in background
echo "🚀 Starting Snapper Voice WebSocket Server..."
node server.js >> logs/server.log 2>&1 &

# Get PID
SERVER_PID=$!
echo $SERVER_PID > logs/server.pid

sleep 2

# Check if still running
if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Server started successfully (PID: $SERVER_PID)"
    echo "   WebSocket: wss://bransonsmini.tail8d2a35.ts.net/ws"
    echo "   Logs: tail -f logs/server.log"
else
    echo "❌ Server failed to start"
    exit 1
fi
