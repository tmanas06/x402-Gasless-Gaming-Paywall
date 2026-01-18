#!/bin/bash

echo "🚀 Starting all services..."
echo ""

# Start frontend
echo "Starting Frontend..."
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

sleep 2

# Start backend
echo "Starting Backend..."
cd backend && npm run dev &
BACKEND_PID=$!
cd ..

sleep 2

# Start agent
echo "Starting Agent..."
cd agent && npm run dev &
AGENT_PID=$!
cd ..

echo ""
echo "✅ All services started!"
echo "Frontend PID: $FRONTEND_PID"
echo "Backend PID: $BACKEND_PID"
echo "Agent PID: $AGENT_PID"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down all services..."
    kill $FRONTEND_PID $BACKEND_PID $AGENT_PID 2>/dev/null
    exit 0
}

# Trap SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

# Wait for all processes
wait

