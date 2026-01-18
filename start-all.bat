@echo off
echo Starting all services...
echo.

start "Frontend - Gasless Arcade" cmd /k "cd frontend && npm run dev"
timeout /t 2 /nobreak > nul

start "Backend - Gasless Arcade" cmd /k "cd backend && npm run dev"
timeout /t 2 /nobreak > nul

start "Agent - Gasless Arcade" cmd /k "cd agent && npm run dev"
timeout /t 2 /nobreak > nul

echo All services started in separate windows!
echo Close the windows to stop the services.
pause

