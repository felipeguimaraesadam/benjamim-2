#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate

# Cria o superusuário se não existir (usando variáveis de ambiente)
python manage.py create_superuser_if_not_exists

# --- COMANDO PARA IMPORTAR DADOS (USAR APENAS UMA VEZ) ---
# O dono do projeto vai descomentar esta linha quando for a hora.
# curl -o backup_cliente.json "URL_DO_BACKUP_AQUI" && python manage.py loaddata backup_cliente.json
# -----------------------------------------------------------