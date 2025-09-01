@echo off
echo ========================================
echo Muyacon Admin Panel Setup
echo ========================================
echo.

echo Installing dependencies...
npm install

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Copy env.example to .env.local
echo 2. Add your Supabase credentials to .env.local
echo 3. Run: npm run dev
echo 4. Open: http://localhost:3001
echo.
pause
