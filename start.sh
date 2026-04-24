#!/bin/bash

# AI Precision Fermentation Process Optimizer - Start Script
# This script sets up and runs the entire application

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  AI Precision Fermentation Process Optimizer     ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# Load .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

SERVER_PORT=${SERVER_PORT:-3001}
CLIENT_PORT=${CLIENT_PORT:-3000}

# Step 1: Clean up used ports
echo -e "${YELLOW}[1/6] Cleaning up ports ${SERVER_PORT} and ${CLIENT_PORT}...${NC}"
kill_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "  Killing processes on port $port: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
}
kill_port $SERVER_PORT
kill_port $CLIENT_PORT
echo -e "${GREEN}  Ports cleaned.${NC}"

# Step 2: Install dependencies
echo -e "${YELLOW}[2/6] Installing dependencies...${NC}"
cd server && npm install 2>&1 | tail -1
cd ../client && npm install 2>&1 | tail -1
cd ..
echo -e "${GREEN}  Dependencies installed.${NC}"

# Step 3: Create database
echo -e "${YELLOW}[3/6] Setting up PostgreSQL database...${NC}"
DB_NAME="fermentation_optimizer"

# Check if postgres is running
if ! pg_isready -q 2>/dev/null; then
  echo -e "${RED}  PostgreSQL is not running. Starting it...${NC}"
  brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
  sleep 2
fi

# Create database if not exists
if psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
  echo -e "  Database '$DB_NAME' already exists."
else
  createdb "$DB_NAME" 2>/dev/null || echo -e "  Database may already exist."
fi
echo -e "${GREEN}  Database ready.${NC}"

# Step 4: Seed database
echo -e "${YELLOW}[4/6] Seeding database with sample data...${NC}"
cd server && node seed.js
cd ..
echo -e "${GREEN}  Database seeded.${NC}"

# Step 5: Start backend with hot reload (nodemon)
echo -e "${YELLOW}[5/6] Starting backend server on port ${SERVER_PORT} (with hot reload)...${NC}"
cd server && npx nodemon index.js &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo -e "  Waiting for backend..."
for i in {1..30}; do
  if curl -s http://localhost:$SERVER_PORT/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}  Backend running on http://localhost:${SERVER_PORT}${NC}"
    break
  fi
  sleep 1
done

# Step 6: Start frontend with hot reload (Vite)
echo -e "${YELLOW}[6/6] Starting frontend on port ${CLIENT_PORT} (with hot reload)...${NC}"
cd client && npx vite --port $CLIENT_PORT --host &
FRONTEND_PID=$!
cd ..

sleep 3
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Application is running!                        ║${NC}"
echo -e "${GREEN}║                                                  ║${NC}"
echo -e "${GREEN}║  Frontend:  http://localhost:${CLIENT_PORT}              ║${NC}"
echo -e "${GREEN}║  Backend:   http://localhost:${SERVER_PORT}/api          ║${NC}"
echo -e "${GREEN}║                                                  ║${NC}"
echo -e "${GREEN}║  Login:     demo@fermentation.ai / password123   ║${NC}"
echo -e "${GREEN}║                                                  ║${NC}"
echo -e "${GREEN}║  Press Ctrl+C to stop all services               ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"

# Cleanup on exit
cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down...${NC}"
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  kill_port $SERVER_PORT
  kill_port $CLIENT_PORT
  echo -e "${GREEN}All services stopped.${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for processes
wait
