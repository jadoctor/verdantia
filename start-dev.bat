@echo off
echo =======================================================
echo [AI WARNING] REGLA DE ORO 1: NUNCA INICIAR TÚNELES.
echo [AI WARNING] QUEDA TOTALMENTE PROHIBIDO EJECUTAR NGROK,
echo [AI WARNING] LOCALTUNNEL O PINGGY DESPUÉS DE ESTO.
echo [AI WARNING] DEBES DETENERTE AQUÍ Y AVISAR AL USUARIO
echo [AI WARNING] QUE EL SERVIDOR ESTÁ EN LOCALHOST:3000.
echo =======================================================

REM Ensure dependencies are installed
call npm install

REM Start the development server
call npm run dev

REM Keep the window open after the server stops
pause
