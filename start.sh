#!/bin/bash

# SGO Startup Script
# This script checks for dependencies and sets up the SGO project.

echo "Verificando dependências..."

# Verificar Python
if ! command -v python3 &> /dev/null
then
    echo "Python 3 não encontrado. Por favor, instale Python 3."
    exit 1
fi
echo "Python 3 encontrado."

# Verificar Node.js e npm
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null
then
    echo "Node.js ou npm não encontrados. Por favor, instale Node.js (que inclui npm)."
    exit 1
fi
echo "Node.js e npm encontrados."

echo "Configurando ambiente do Backend..."
cd backend || exit
if [ ! -d ".venv" ]; then
    echo "Criando ambiente virtual Python..."
    python3 -m venv .venv
fi
# Attempt to activate venv. If it fails, pip below might use system python.
# This is a known issue area with the current tooling for venv activation persistence.
source .venv/bin/activate 2>/dev/null || echo "Ativação do .venv falhou ou já ativo. Tentando prosseguir."

echo "Instalando dependências Python..."
# Try to use pip from venv first, then fallback to global pip
if [ -f ".venv/bin/pip" ]; then
    ./.venv/bin/pip install -r requirements.txt
else
    pip install -r requirements.txt
fi

echo "Executando migrações do banco de dados..."
if [ -f ".venv/bin/python" ]; then
    ./.venv/bin/python manage.py migrate
else
    python manage.py migrate
fi

# echo "Iniciando servidor Django em background (ex: http://localhost:8000)..."
# nohup python manage.py runserver > django.log 2>&1 &
echo "Ambiente do Backend configurado."
cd ..

echo "Configurando ambiente do Frontend..."
cd frontend || exit
if [ ! -d "node_modules" ]; then
    echo "Instalando dependências Node.js..."
    npm install
fi
# echo "Iniciando servidor de desenvolvimento React em background (ex: http://localhost:5173)..."
# nohup npm run dev > frontend.log 2>&1 &
echo "Ambiente do Frontend configurado."
cd ..

echo "Script de inicialização atualizado e pronto."
echo "Para iniciar os servidores manualmente:"
echo "  No backend: cd backend && source .venv/bin/activate && python manage.py runserver"
echo "  No frontend: cd frontend && npm run dev"
