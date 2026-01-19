# Deployment Status

## ✅ Completed

### Frontend (Vercel)
- **Status**: ✅ Deployed
- **Preview URL**: https://frontend-lxfo6ir4z-tmanas06s-projects.vercel.app
- **Production URL**: Check Vercel dashboard for production domain
- **Account**: tmanas06
- **Next Steps**:
  1. Go to https://vercel.com/tmanas06s-projects/frontend
  2. Set environment variables:
     - `NEXT_PUBLIC_API_URL` = (Backend URL - set after backend deployment)
     - `NEXT_PUBLIC_PRIVY_APP_ID` = (Your Privy App ID)
     - `NEXT_PUBLIC_PRIVY_CLIENT_ID` = (Your Privy Client ID)
  3. Redeploy to apply environment variables

### Code Fixes
- ✅ Leaderboard service fixed to use RewardService data
- ✅ Backend CORS configured for production
- ✅ Next.js updated to latest version
- ✅ Railway configuration files created
- ✅ Vercel configuration updated
- ✅ Deployment scripts created

## ⏳ Pending

### Backend (Railway)
**Status**: ⏳ Requires manual login

**Steps to deploy**:
1. Open terminal and run:
   ```bash
   railway login
   ```
   (This will open browser for authentication)

2. After login, run:
   ```bash
   cd backend
   railway init
   ```
   - Select: "Create a new project"
   - Project name: `gasless-arcade-backend`

3. Set environment variables in Railway dashboard:
   - `PORT` = `5000`
   - `GROQ_API_KEY` = (Your GROQ API key)
   - `GROQ_MODEL` = `llama-3.3-70b-versatile`
   - `CRONOS_TESTNET_RPC` = `https://evm-t3.cronos.org`
   - `REWARD_WALLET_PRIVATE_KEY` = (Your reward wallet private key)
   - `CROSCAN_API_KEY` = (Your Cronoscan API key)
   - `GAME_FREE_PLAYS` = `3`
   - `GAME_FEE_AMOUNT` = `10000000`
   - `FRONTEND_URL` = (Your Vercel frontend URL - update after frontend is configured)

4. Deploy:
   ```bash
   railway up
   ```

5. Get backend URL:
   ```bash
   railway domain
   ```
   Or check Railway dashboard

### Agent (Railway)
**Status**: ⏳ Requires backend to be deployed first

**Steps to deploy**:
1. After backend is deployed, run:
   ```bash
   cd agent
   railway init
   ```
   - Select: "Add to existing project"
   - Select: `gasless-arcade-backend`

2. Set environment variables in Railway dashboard:
   - `GROQ_API_KEY` = (Your GROQ API key)
   - `GROQ_MODEL` = `llama-3.3-70b-versatile`
   - `AI_TYPE` = `both`
   - `GAME_API_URL` = (Backend URL from step above)
   - `AGENT_PRIVATE_KEY` = (Your agent private key)
   - `CRONOS_RPC` = `https://evm-t3.cronos.org`
   - `MAX_PAYMENT_PER_TX` = `0.05`
   - `DAILY_SPENDING_LIMIT` = `0.50`
   - `AUTO_PAY_ENABLED` = `true`

3. Deploy:
   ```bash
   railway up
   ```

## 🔄 Final Configuration Steps

After all services are deployed:

1. **Update Backend CORS**:
   - In Railway backend service, add/update:
     - `FRONTEND_URL` = Your Vercel frontend production URL

2. **Update Frontend Environment Variables**:
   - In Vercel dashboard, update:
     - `NEXT_PUBLIC_API_URL` = Your Railway backend URL

3. **Update Agent Environment Variables**:
   - In Railway agent service, verify:
     - `GAME_API_URL` = Your Railway backend URL

4. **Redeploy Services**:
   - Backend: `railway up` (in backend directory)
   - Frontend: Push to GitHub or use Vercel dashboard to redeploy
   - Agent: `railway up` (in agent directory)

## 🧪 Testing Checklist

After deployment:
- [ ] Backend health check: `https://your-backend.railway.app/health`
- [ ] Frontend loads: `https://your-frontend.vercel.app`
- [ ] Frontend can connect to backend
- [ ] Game play works
- [ ] Payment flow works
- [ ] Reward claiming works
- [ ] Leaderboard displays
- [ ] AI chat works

## 📝 Quick Reference

### Railway Commands
```bash
railway login          # Login to Railway
railway init          # Initialize project
railway up            # Deploy
railway logs          # View logs
railway domain        # Get domain
railway variables     # List environment variables
```

### Vercel Commands
```bash
vercel login          # Login to Vercel
vercel --prod         # Deploy to production
vercel env ls         # List environment variables
vercel env add        # Add environment variable
```

## 🆘 Troubleshooting

### Backend not starting
- Check Railway logs: `railway logs`
- Verify all environment variables are set
- Check `REWARD_WALLET_PRIVATE_KEY` is valid

### Frontend can't connect
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check backend CORS allows frontend domain
- Verify backend is running

### Agent not working
- Verify `GAME_API_URL` points to backend
- Check `AGENT_PRIVATE_KEY` is set
- Verify `GROQ_API_KEY` is valid
