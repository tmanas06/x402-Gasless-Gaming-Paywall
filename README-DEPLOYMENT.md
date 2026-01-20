# Deployment Guide

This monorepo is structured for deployment on Vercel with:
- **Frontend** → Deployed on Vercel as the main project (React/Next.js, served at `/`)
- **Backend** → Deployed on Vercel as an API (Express, served at `/api/*`)
- **Agent** → Runs locally (for demo) and can be manually triggered against the deployed backend

## Architecture

### Frontend (Next.js)
- Root directory: `frontend/`
- Served at: `/` (root)
- API calls use relative `/api` paths in production

### Backend (Express)
- Root directory: `backend/`
- Served at: `/api/*` via Vercel serverless functions
- Entry point: `backend/api/index.ts`

### Agent (Node.js)
- Root directory: `agent/`
- Runs locally only
- Configurable via `BACKEND_URL` environment variable

## Local Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start all services:**
   ```bash
   npm run dev
   ```

This will start:
- Frontend on `http://localhost:3000`
- Backend on `http://localhost:5000`
- Agent (if configured)

### Individual Service Commands

```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend

# Agent only
npm run dev:agent
```

## Vercel Deployment

Since Vercel doesn't natively support multiple root directories in a single project, deploy as **two separate Vercel projects**:

### Project 1: Frontend

1. **Create a new Vercel project:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository
   - **IMPORTANT**: Set **Root Directory** to `frontend`
   - This is critical - Vercel needs to know where your Next.js app is located

2. **Configure Build Settings:**
   - Framework Preset: Next.js (should auto-detect)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)
   - Install Command: `npm install` (auto-detected)
   - **Note**: If Next.js is not detected, verify Root Directory is set to `frontend`

3. **Set Environment Variables:**
   ```
   NEXT_PUBLIC_BACKEND_URL=https://your-backend-project.vercel.app
   NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
   NEXT_PUBLIC_PRIVY_CLIENT_ID=your_privy_client_id
   ```

4. **Deploy:**
   - Click "Deploy"
   - Note the frontend URL (e.g., `https://your-frontend.vercel.app`)

### Project 2: Backend

1. **Create a second Vercel project:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import the same GitHub repository
   - Set **Root Directory** to `backend`

2. **Configure Build Settings:**
   - Framework Preset: Other
   - Build Command: `npm install && npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Set Runtime:**
   - Go to Settings → Functions
   - Set Node.js Version to 18.x

4. **Set Environment Variables:**
   ```
   PORT=5000
   NODE_ENV=production
   GROQ_API_KEY=your_groq_api_key
   GROQ_MODEL=llama-3.3-70b-versatile
   CRONOS_TESTNET_RPC=https://evm-t3.cronos.org
   REWARD_WALLET_PRIVATE_KEY=your_reward_wallet_private_key
   CROSCAN_API_KEY=your_cronoscan_api_key
   GAME_FREE_PLAYS=3
   GAME_FEE_AMOUNT=10000000
   FRONTEND_URL=https://your-frontend.vercel.app
   ```

5. **Configure Routes:**
   - Create `vercel.json` in backend root (or update existing):
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "api/index.ts",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "/api/index.ts"
       },
       {
         "src": "/health",
         "dest": "/api/index.ts"
       }
     ]
   }
   ```

6. **Deploy:**
   - Click "Deploy"
   - Note the backend URL (e.g., `https://your-backend.vercel.app`)

### Post-Deployment Configuration

1. **Update Frontend Environment Variable:**
   - Go to Frontend project → Settings → Environment Variables
   - Update `NEXT_PUBLIC_BACKEND_URL` with your backend URL
   - Redeploy frontend

2. **Update Backend CORS:**
   - Go to Backend project → Settings → Environment Variables
   - Update `FRONTEND_URL` with your frontend URL
   - Redeploy backend

## Running Agent Against Deployed Backend

The agent can be run locally and configured to use the deployed backend:

1. **Navigate to agent directory:**
   ```bash
   cd agent
   ```

2. **Create/update `.env` file:**
   ```env
   BACKEND_URL=https://your-backend.vercel.app
   AGENT_PRIVATE_KEY=your_agent_private_key
   CRONOS_RPC=https://evm-t3.cronos.org
   GROQ_API_KEY=your_groq_api_key
   GROQ_MODEL=llama-3.3-70b-versatile
   AI_TYPE=both
   MAX_PAYMENT_PER_TX=0.05
   DAILY_SPENDING_LIMIT=0.50
   AUTO_PAY_ENABLED=true
   ```

3. **Run the agent:**
   ```bash
   npm run dev
   ```

The agent will now make requests to your deployed backend instead of localhost.

## Environment Variables Reference

### Backend Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port (not used in Vercel) | No | `5000` |
| `NODE_ENV` | Environment | No | `production` |
| `GROQ_API_KEY` | GROQ API key for AI chat | Yes | - |
| `GROQ_MODEL` | GROQ model to use | No | `llama-3.3-70b-versatile` |
| `CRONOS_TESTNET_RPC` | Cronos testnet RPC URL | Yes | `https://evm-t3.cronos.org` |
| `REWARD_WALLET_PRIVATE_KEY` | Private key for reward wallet | Yes | - |
| `CROSCAN_API_KEY` | Cronoscan API key | No | - |
| `GAME_FREE_PLAYS` | Number of free plays allowed | No | `3` |
| `GAME_FEE_AMOUNT` | Game fee amount | No | `10000000` |
| `FRONTEND_URL` | Frontend URL for CORS | Yes | - |

### Frontend Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_BACKEND_URL` | Backend API URL | No | `/api` (relative) |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy App ID | Yes | - |
| `NEXT_PUBLIC_PRIVY_CLIENT_ID` | Privy Client ID | Yes | - |

### Agent Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `BACKEND_URL` | Backend API URL | No | `http://localhost:5000` |
| `GAME_API_URL` | Alias for BACKEND_URL | No | Same as BACKEND_URL |
| `AGENT_PRIVATE_KEY` | Agent wallet private key | Yes | - |
| `CRONOS_RPC` | Cronos RPC URL | Yes | `https://evm-t3.cronos.org` |
| `GROQ_API_KEY` | GROQ API key | No | - |
| `GROQ_MODEL` | GROQ model | No | `llama-3.3-70b-versatile` |
| `AI_TYPE` | AI type: cronos/groq/both | No | `cronos` |
| `MAX_PAYMENT_PER_TX` | Max payment per transaction | No | `0.05` |
| `DAILY_SPENDING_LIMIT` | Daily spending limit | No | `0.50` |
| `AUTO_PAY_ENABLED` | Enable auto-pay | No | `false` |

## Troubleshooting

### Backend not responding
- Check Vercel function logs
- Verify all environment variables are set
- Check that routes are configured correctly in `vercel.json`

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_BACKEND_URL` is set correctly
- Check browser console for CORS errors
- Ensure backend `FRONTEND_URL` includes your frontend domain

### Agent can't connect to backend
- Verify `BACKEND_URL` is set to the deployed backend URL
- Check network connectivity
- Verify backend is deployed and accessible

## Notes

- **x402/EIP-3009 Logic**: All payment protocol logic remains unchanged
- **Local Development**: Use `npm run dev` from root to start all services locally
- **Production**: Frontend and backend are deployed separately on Vercel
- **Agent**: Runs locally only, can be configured to use deployed backend
