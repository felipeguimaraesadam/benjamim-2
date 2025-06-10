@echo off
echo ==========================================================
echo [SGO] SCRIPT DE CONFIGURACAO DO AMBIENTE
echo ==========================================================
echo Este script ira instalar todas as dependencias.
echo Certifique-se de que Python e Node.js estao instalados.
echo.
pause
echo.

echo [PASSO 1 de 2] - Configurando o Backend (Python/Django)...
cd backend

echo    - Criando ambiente virtual 'venv'...
python -m venv venv

echo    - Ativando ambiente e instalando dependencias (requirements.txt)...
call venv\Scriptsctivate.bat
pip install -r requirements.txt

echo    - Executando migracoes do banco de dados...
python manage.py migrate

echo Backend configurado com sucesso!
cd ..
echo.

echo [PASSO 2 de 2] - Configurando o Frontend (React/Vite)...
cd frontend

echo    - Instalando dependencias (npm install)...
call npm install

echo Frontend configurado com sucesso!
cd ..
echo.

echo ==========================================================
echo    CONFIGURACAO CONCLUIDA!
echo    Execute 'start.bat' para iniciar a aplicacao.
echo ==========================================================
pause
