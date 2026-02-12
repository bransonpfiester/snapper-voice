#!/bin/bash

# Stop Snapper Voice WebSocket Server
cd "$(dirname "$0")"

if [ -f logs/server.pid ]; then
    PID=$(cat logs/server.pid)
    if ps -p $PID > /dev/null; then
        echo "🛑 Stopping server (PID: $PID)..."
        kill $PID
        sleep 2
        
        if ps -p $PID > /dev/null; then
            echo "⚠️  Force killing..."
            kill -9 $PID
        fi
        
        echo "✅ Server stopped"
    else
        echo "⚠️  Server not running (PID file exists but process is dead)"
    fi
    rm logs/server.pid
else
    # Try to kill by port
    PID=$(lsof -ti:18791)
    if [ ! -z "$PID" ]; then
        echo "🛑 Stopping server on port 18791 (PID: $PID)..."
        kill $PID
        echo "✅ Server stopped"
    else
        echo "ℹ️  Server not running"
    fi
fi
