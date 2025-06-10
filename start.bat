@echo off
echo ==========================================================
echo [SGO] INICIANDO APLICACAO
echo ==========================================================
echo.

echo [1/3] Iniciando servidor do Backend (Django) em uma nova janela...
start "Backend Server" cmd /k "cd backend && call venv\Scriptsctivate.bat && python manage.py runserver"

echo [2/3] Iniciando servidor do Frontend (React) em uma nova janela...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo Aguardando 8 segundos para os servidores inicializarem...
timeout /t 8 /nobreak > nul

echo [3/3] Abrindo a aplicacao no seu navegador...
start http://localhost:5173

echo.
echo ==========================================================
echo    Servidores iniciados. Verifique as janelas do terminal
echo    para logs e status.
echo ==========================================================
pause
