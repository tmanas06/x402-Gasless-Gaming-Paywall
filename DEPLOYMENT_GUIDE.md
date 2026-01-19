# Complete Deployment Guide

## Prerequisites ✅
- ✅ Vercel CLI installed and logged in (tmanas06)
- ✅ Railway CLI installed
- ⚠️ Railway login required (run `railway login` in terminal)

## Step-by-Step Deployment

### Step 1: Login to Railway (Required)

Open a terminal and run:
```bash
railway login
```

This will open your browser for authentication. Complete the login process.

### Step 2: Deploy Backend to Railway

```bash
cd backend
railway init
# Select: Create a new project
# Project name: gasless-arcade-backend

# Set environment variables in Railway dashboard:
# - PORT=5000
# - GROQ_API_KEY=your_groq_api_key
# - CRONOS_TESTNET_RPC=https://evm-t3.cronos.org
# - REWARD_WALLET_PRIVATE_KEY=your_private_key
# - CROSCAN_API_KEY=your_cronoscan_api_key
# - GAME_FREE_PLAYS=3
# - GAME_FEE_AMOUNT=10000000
# - FRONTEND_URL=https://your-frontend.vercel.app (update after frontend deploy)

railway up
```

After deployment, note the backend URL (e.g., `https://backend-production.up.railway.app`)

### Step 3: Deploy Agent to Railway

```bash
cd ../agent
railway init
# Select: Add to existing project
# Select: gasless-arcade-backend

# Set environment variables:
# - GROQ_API_KEY=your_groq_api_key
# - GROQ_MODEL=llama-3.3-70b-versatile
# - AI_TYPE=both
# - GAME_API_URL=https://your-backend-url.railway.app (from step 2)
# - AGENT_PRIVATE_KEY=your_agent_private_key
# - CRONOS_RPC=https://evm-t3.cronos.org
# - MAX_PAYMENT_PER_TX=0.05
# - DAILY_SPENDING_LIMIT=0.50
# - AUTO_PAY_ENABLED=true

railway up
```

### Step 4: Deploy Frontend to Vercel

```bash
cd ../frontend
vercel --prod
# Follow prompts if needed
# Set environment variables in Vercel dashboard:
# - NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
# - NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
# - NEXT_PUBLIC_PRIVY_CLIENT_ID=your_privy_client_id
```

After deployment, note the frontend URL (e.g., `https://your-app.vercel.app`)

### Step 5: Update Environment Variables

1. **Backend (Railway)**: Update `FRONTEND_URL` with your Vercel URL
2. **Frontend (Vercel)**: Verify `NEXT_PUBLIC_API_URL` is set correctly
3. **Agent (Railway)**: Verify `GAME_API_URL` is set correctly

### Step 6: Verify Deployment

1. Check backend health: `https://your-backend.railway.app/health`
2. Visit frontend: `https://your-app.vercel.app`
3. Test game functionality
4. Test payment flow
5. Test reward claiming
6. Test leaderboard

## Troubleshooting

### Backend not starting:
- Check Railway logs
- Verify all environment variables are set
- Check REWARD_WALLET_PRIVATE_KEY is valid

### Frontend can't connect to backend:
- Verify NEXT_PUBLIC_API_URL is correct
- Check CORS settings (should allow Vercel domain)
- Verify backend is running

### Agent not working:
- Verify GAME_API_URL points to backend
- Check AGENT_PRIVATE_KEY is set
- Verify GROQ_API_KEY is valid

## Quick Deploy Scripts

### Windows (PowerShell):
```powershell
.\deploy.bat
```

### Linux/Mac:
```bash
chmod +x deploy.sh
./deploy.sh
```

**Note**: These scripts require manual Railway login first.
