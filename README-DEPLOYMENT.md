# Deployment Guide - Gasless Arcade

## 🚀 Running All Services Locally

### Option 1: Using npm scripts (Recommended)

Install dependencies for all services:
```bash
npm run install:all
```

Start all services in development mode:
```bash
npm run dev
```

This will start:
- **Frontend** on `http://localhost:3000`
- **Backend** on `http://localhost:5000`
- **Agent** on the configured port

### Option 2: Using start scripts

**Windows:**
```bash
start-all.bat
```

**Mac/Linux:**
```bash
chmod +x start-all.sh
./start-all.sh
```

**Node.js (cross-platform):**
```bash
node start-all.js
```

### Option 3: Manual start

Open 3 separate terminals:

**Terminal 1 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 3 - Agent:**
```bash
cd agent
npm run dev
```

## 🐳 Docker Deployment

### Build and run all services with Docker Compose:

```bash
docker-compose up --build
```

This will:
- Build all three services
- Start them in isolated containers
- Set up networking between services

### Stop services:
```bash
docker-compose down
```

## ☁️ Vercel Deployment

### Important Notes:
Vercel only supports serverless functions for Next.js. For this project:
- **Frontend**: Can be deployed to Vercel
- **Backend**: Needs separate hosting (Railway, Render, AWS, etc.)
- **Agent**: Needs separate hosting (same as backend or different)

### Deploy Frontend to Vercel:

1. **Set environment variables in Vercel:**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
   ```

2. **Deploy:**
   ```bash
   cd frontend
   vercel
   ```

### Deploy Backend (Railway/Render/AWS):

**Railway:**
1. Connect your GitHub repo
2. Select `backend` folder as root
3. Set environment variables
4. Deploy

**Render:**
1. Create a new Web Service
2. Point to `backend` folder
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables

### Environment Variables Needed:

**Backend (.env):**
```
PORT=5000
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
CRONOS_TESTNET_RPC=https://evm-t3.cronos.org
REWARD_WALLET_PRIVATE_KEY=your_private_key
GAME_FREE_PLAYS=3
GAME_FEE_AMOUNT=10000000
GAME_FEE_CURRENCY=USDC
FACILITATOR_ADDRESS=your_facilitator_address
```

**Agent (.env):**
```
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
AI_TYPE=both
GAME_API_URL=https://your-backend-url.railway.app
AGENT_PRIVATE_KEY=your_agent_private_key
CRONOS_RPC=https://evm-t3.cronos.org
MAX_PAYMENT_PER_TX=0.05
DAILY_SPENDING_LIMIT=0.50
AUTO_PAY_ENABLED=true
```

## 📋 Production Checklist

- [ ] Set all environment variables
- [ ] Update `NEXT_PUBLIC_API_URL` in frontend
- [ ] Build and test all services
- [ ] Configure CORS in backend for frontend domain
- [ ] Set up SSL certificates
- [ ] Configure rate limiting
- [ ] Set up monitoring/logging
- [ ] Test AI chat functionality
- [ ] Test payment flows
- [ ] Test reward claiming

## 🔧 Troubleshooting

**Services won't start:**
- Check that all dependencies are installed: `npm run install:all`
- Verify environment variables are set
- Check ports aren't already in use

**AI Chat not working:**
- Verify `GROQ_API_KEY` is set in backend
- Check GROQ model is available (use `llama-3.3-70b-versatile`)
- Check backend logs for errors

**Frontend can't connect to backend:**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings in backend
- Ensure backend is running and accessible

