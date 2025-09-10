#!/usr/bin/env bash
# exit on error
set -o errexit

# Otimizações para reduzir uso de memória
export PIP_NO_CACHE_DIR=1
export PYTHONDONTWRITEBYTECODE=1
export PYTHONOPTIMIZE=1
export PYTHONUNBUFFERED=1

# Aplicar otimizações de memória
python memory_optimization.py

# Instalar dependências com cache desabilitado para economizar memória
pip install --no-cache-dir -r requirements.txt

# Executar collectstatic com configurações otimizadas
python manage.py collectstatic --no-input --clear

# Executar migrações de forma otimizada (sem --run-syncdb para evitar problemas)
python manage.py migrate

# Cria o superusuário se não existir (usando variáveis de ambiente)
python manage.py create_superuser_if_not_exists

echo "Build concluído com otimizações de memória aplicadas!"

# --- COMANDO PARA IMPORTAR DADOS (USAR APENAS UMA VEZ) ---
# O dono do projeto vai descomentar esta linha quando for a hora.
# curl -o backup_cliente.json "URL_DO_BACKUP_AQUI" && python manage.py loaddata backup_cliente.json
# -----------------------------------------------------------