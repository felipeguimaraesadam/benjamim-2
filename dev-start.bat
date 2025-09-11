@echo off
REM Script para iniciar o ambiente de desenvolvimento SGO no Windows
REM Este script inicia tanto o backend quanto o frontend automaticamente

echo ========================================
echo    SGO - Sistema de Gestao de Obras
echo    Iniciando Ambiente de Desenvolvimento
echo ========================================
echo.

REM Verificar se Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Python nao encontrado. Instale Python 3.8+ primeiro.
    pause
    exit /b 1
)

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado. Instale Node.js primeiro.
    pause
    exit /b 1
)

echo Verificando ambiente...
echo.

REM Verificar se o virtual environment existe
if not exist "backend\venv" (
    echo Configurando ambiente pela primeira vez...
    python dev-scripts.py setup
    if errorlevel 1 (
        echo ERRO: Falha na configuracao do ambiente.
        pause
        exit /b 1
    )
)

echo Iniciando servidores...
echo.
echo Backend: http://127.0.0.1:8000
echo Frontend: http://localhost:3000
echo Admin: http://127.0.0.1:8000/admin
echo.
echo Login padrao: admin / admin123
echo.
echo Pressione Ctrl+C para parar os servidores
echo ========================================
echo.

REM Iniciar backend em uma nova janela
start "SGO Backend" cmd /k "cd /d backend && venv\Scripts\activate && python manage.py runserver"

REM Aguardar um pouco para o backend iniciar
timeout /t 3 /nobreak >nul

REM Iniciar frontend em uma nova janela
start "SGO Frontend" cmd /k "cd /d frontend && npm run dev"

echo Servidores iniciados em janelas separadas.
echo Feche este terminal quando terminar o desenvolvimento.
echo.
pause