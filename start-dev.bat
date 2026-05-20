@echo off
REM Ensure dependencies are installed
call npm install

REM Start the development server
call npm run dev

REM Keep the window open after the server stops
pause
