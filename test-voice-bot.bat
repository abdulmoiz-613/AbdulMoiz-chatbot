@echo off
echo ===================================
echo  Abdul Moiz's Voice Bot - Test Script
echo ===================================
echo.

REM Check if Node.js is installed
echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js is installed

REM Check if npm is installed
echo Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    pause
    exit /b 1
)
echo ✓ npm is installed

REM Check backend dependencies
echo.
echo Checking backend dependencies...
cd backend
if not exist "node_modules" (
    echo Installing backend dependencies...
    npm install
) else (
    echo ✓ Backend dependencies already installed
)

REM Check if .env file exists
if not exist ".env" (
    echo WARNING: .env file not found in backend directory
    echo Please create a .env file with your GROQ_API_KEY
    echo Example:
    echo GROQ_API_KEY=your_api_key_here
    echo GROQ_PROJECT_ID=your_project_id_here
    pause
)

REM Check frontend dependencies
echo.
echo Checking frontend dependencies...
cd ..\frontend
if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install
) else (
    echo ✓ Frontend dependencies already installed
)

cd ..

echo.
echo ===================================
echo  System Requirements Check
echo ===================================
echo.
echo For voice features to work properly:
echo ✓ Use Chrome, Edge, or Safari browser
echo ✓ Ensure microphone permissions are granted
echo ✓ Use HTTPS or localhost (required for voice API)
echo ✓ Backend must be running on port 5000
echo ✓ Frontend will run on port 3000
echo.
echo ===================================
echo  Starting Application...
echo ===================================
echo.

REM Start the application
call start-dev.bat
