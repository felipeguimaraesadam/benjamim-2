#!/usr/bin/env bash
# exit on error
set -o errexit

# Configurações agressivas para reduzir uso de memória
export PIP_NO_CACHE_DIR=1
export PYTHONDONTWRITEBYTECODE=1
export PYTHONOPTIMIZE=2
export PYTHONUNBUFFERED=1
export PYTHONHASHSEED=1
export MALLOC_TRIM_THRESHOLD_=100000
export MALLOC_MMAP_THRESHOLD_=100000

# Limitar uso de memória do Python
export PYTHONMALLOC=malloc

# Aplicar otimizações de memória
python memory_optimization.py

# Limpar cache antes da instalação
rm -rf ~/.cache/pip
rm -rf /tmp/*

# Instalar dependências com configurações otimizadas
pip install --no-cache-dir --no-deps -r requirements.txt
pip check

# Executar collectstatic com configurações otimizadas
python manage.py collectstatic --no-input --clear --verbosity=0

# Executar migrações de forma otimizada
python manage.py migrate --verbosity=0

# Cria o superusuário se não existir
python manage.py create_superuser_if_not_exists || echo "Erro ao criar superusuário, continuando..."

# Limpar arquivos temporários após build
rm -rf /tmp/*
rm -rf ~/.cache/*

echo "Build concluído com otimizações agressivas de memória aplicadas!"