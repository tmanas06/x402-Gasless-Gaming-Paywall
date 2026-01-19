@echo off
echo 🚀 Starting Complete Deployment Process...
echo.

REM Check if Railway CLI is installed
where railway >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing Railway CLI...
    call npm install -g @railway/cli
)

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing Vercel CLI...
    call npm install -g vercel
)

echo ✅ All tools ready
echo.

REM Step 1: Deploy Backend
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo Step 1/3: Deploying Backend to Railway...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
cd backend
call railway link
call railway up
cd ..
echo ✅ Backend deployed
echo.

REM Step 2: Deploy Agent
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo Step 2/3: Deploying Agent to Railway...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
cd agent
call railway link
call railway up
cd ..
echo ✅ Agent deployed
echo.

REM Step 3: Deploy Frontend
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo Step 3/3: Deploying Frontend to Vercel...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
cd frontend
call vercel --prod --yes
cd ..
echo ✅ Frontend deployed
echo.

echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🎉 Deployment Complete!
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo ⚠️  IMPORTANT: Update environment variables in each platform's dashboard
echo.
