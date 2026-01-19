# Refactoring Summary - Vercel Deployment

## Overview
This monorepo has been refactored to be fully deployable on Vercel with:
- **Frontend** → Vercel (Next.js, served at `/`)
- **Backend** → Vercel (Express API, served at `/api/*`)
- **Agent** → Local only (configurable via `BACKEND_URL`)

## Files Created

### Backend
- `backend/index.ts` - Main Express app (exports app, no app.listen in production)
- `backend/api/index.ts` - Vercel serverless function handler
- `backend/vercel.json` - Vercel configuration for backend

### Documentation
- `README-DEPLOYMENT.md` - Complete deployment guide
- `REFACTORING_SUMMARY.md` - This file

## Files Modified

### Backend
- `backend/package.json`
  - Changed `main` from `src/server.ts` to `index.ts`
  - Updated `dev` script to use `index.ts`
  - Added `@vercel/node` dependency
  
- `backend/tsconfig.json`
  - Updated `include` to include `index.ts` and `api/**/*`
  - Changed `rootDir` from `./src` to `.` to support root-level files

- `backend/src/server.ts`
  - **UNCHANGED** - Kept for reference, but no longer used
  - Can be deleted if desired

### Frontend
- `frontend/src/config.ts`
  - Updated to use `NEXT_PUBLIC_BACKEND_URL` with fallback to relative `/api`
  - Uses `window.location.origin + '/api'` in production if env var not set

- `frontend/components/SnakeGame.tsx`
  - Updated API_URL to use `NEXT_PUBLIC_BACKEND_URL` with fallback

- `frontend/components/GuessTheMarket.tsx`
  - Updated API_URL to use `NEXT_PUBLIC_BACKEND_URL` with fallback

- `frontend/app/ai-chat/page.tsx`
  - Updated API_URL to use `NEXT_PUBLIC_BACKEND_URL` with fallback

- `frontend/components/CryptoDodger.tsx`
  - Updated API_URL to use `NEXT_PUBLIC_BACKEND_URL` with fallback

- `frontend/components/game.tsx`
  - Updated API_URL to use `NEXT_PUBLIC_BACKEND_URL` with fallback

- `frontend/next.config.mjs`
  - Updated env var from `NEXT_PUBLIC_API_URL` to `NEXT_PUBLIC_BACKEND_URL`

### Agent
- `agent/src/index.ts`
  - Updated to use `BACKEND_URL` env var (with `GAME_API_URL` as fallback)
  - Supports both local and deployed backend URLs

### Root
- `vercel.json`
  - Updated for frontend deployment configuration

## Key Changes

### 1. Backend Vercel Compatibility
- Express app is now exported as default export
- `app.listen()` only runs in local development (via `require.main === module` check)
- Vercel handler created at `backend/api/index.ts`
- All routes remain at `/api/*` paths

### 2. Frontend API Configuration
- All API calls now use `NEXT_PUBLIC_BACKEND_URL` environment variable
- Falls back to relative `/api` path in production (same origin)
- Falls back to `http://localhost:5000` in development

### 3. Agent Configuration
- Uses `BACKEND_URL` environment variable
- Can be configured to point to deployed backend
- Maintains backward compatibility with `GAME_API_URL`

### 4. x402/EIP-3009 Logic
- **UNCHANGED** - All payment protocol logic remains intact
- No modifications to payment verification, EIP-3009 types, or domain

## Local Development

### Start All Services
```bash
npm run dev
```

This starts:
- Frontend on `http://localhost:3000`
- Backend on `http://localhost:5000`
- Agent (if configured)

### Individual Services
```bash
npm run dev:frontend  # Frontend only
npm run dev:backend   # Backend only
npm run dev:agent     # Agent only
```

## Deployment Instructions

### Frontend (Vercel)
1. Create Vercel project with root directory: `frontend`
2. Set environment variables:
   - `NEXT_PUBLIC_BACKEND_URL` = Backend Vercel URL (after backend is deployed)
   - `NEXT_PUBLIC_PRIVY_APP_ID` = Your Privy App ID
   - `NEXT_PUBLIC_PRIVY_CLIENT_ID` = Your Privy Client ID
3. Deploy

### Backend (Vercel)
1. Create separate Vercel project with root directory: `backend`
2. Set environment variables (see README-DEPLOYMENT.md)
3. Configure `backend/vercel.json` routes
4. Deploy

### Agent (Local)
1. Set `BACKEND_URL` in `agent/.env` to deployed backend URL
2. Run `npm run dev` in `agent/` directory

## Environment Variables

### Backend (Vercel)
- `PORT` = 5000 (not used in Vercel)
- `GROQ_API_KEY` = Your GROQ API key
- `CRONOS_TESTNET_RPC` = https://evm-t3.cronos.org
- `REWARD_WALLET_PRIVATE_KEY` = Your reward wallet private key
- `FRONTEND_URL` = Your frontend Vercel URL
- (See README-DEPLOYMENT.md for complete list)

### Frontend (Vercel)
- `NEXT_PUBLIC_BACKEND_URL` = Your backend Vercel URL
- `NEXT_PUBLIC_PRIVY_APP_ID` = Your Privy App ID
- `NEXT_PUBLIC_PRIVY_CLIENT_ID` = Your Privy Client ID

### Agent (Local)
- `BACKEND_URL` = Backend URL (local or deployed)
- `AGENT_PRIVATE_KEY` = Agent wallet private key
- (See README-DEPLOYMENT.md for complete list)

## Testing Checklist

After deployment:
- [ ] Frontend loads at Vercel URL
- [ ] Backend health check: `https://your-backend.vercel.app/health`
- [ ] Frontend can call backend APIs
- [ ] Game play works
- [ ] Payment flow works (x402)
- [ ] Reward claiming works
- [ ] Leaderboard displays
- [ ] AI chat works
- [ ] Agent can connect to deployed backend (when configured)

## Notes

- **No x402 logic changes**: All payment protocol code remains unchanged
- **No EIP-3009 changes**: Domain and types remain unchanged
- **Backward compatible**: Local development still works with `npm run dev`
- **Two Vercel projects**: Frontend and backend must be deployed as separate projects
