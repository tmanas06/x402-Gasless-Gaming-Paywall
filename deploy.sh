#!/bin/bash

set -e

echo "🚀 Starting Complete Deployment Process..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}Installing Railway CLI...${NC}"
    npm install -g @railway/cli
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Installing Vercel CLI...${NC}"
    npm install -g vercel
fi

echo -e "${GREEN}✅ All tools ready${NC}"
echo ""

# Step 1: Deploy Backend
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 1/3: Deploying Backend to Railway...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
cd backend
railway link
railway up
BACKEND_URL=$(railway domain 2>/dev/null || echo "Check Railway dashboard for URL")
echo -e "${GREEN}✅ Backend deployed${NC}"
cd ..
echo ""

# Step 2: Deploy Agent
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 2/3: Deploying Agent to Railway...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
cd agent
railway link
railway up
echo -e "${GREEN}✅ Agent deployed${NC}"
cd ..
echo ""

# Step 3: Deploy Frontend
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 3/3: Deploying Frontend to Vercel...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
cd frontend
vercel --prod --yes
FRONTEND_URL=$(vercel ls 2>/dev/null | grep -o 'https://[^ ]*' | head -1 || echo "Check Vercel dashboard for URL")
echo -e "${GREEN}✅ Frontend deployed${NC}"
cd ..
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Update environment variables:${NC}"
echo -e "1. Backend FRONTEND_URL: ${FRONTEND_URL}"
echo -e "2. Frontend NEXT_PUBLIC_API_URL: ${BACKEND_URL}"
echo -e "3. Agent GAME_API_URL: ${BACKEND_URL}"
echo ""
