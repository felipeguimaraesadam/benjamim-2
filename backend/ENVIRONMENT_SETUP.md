# Configuração de Ambiente - SGO Backend

Este documento descreve como configurar as variáveis de ambiente para o backend do Sistema de Gestão de Obras (SGO).

## Configuração Básica

### 1. Arquivo .env

Crie um arquivo `.env` na pasta `backend/` baseado no arquivo `.env.example`:

```bash
cp .env.example .env
```

### 2. Variáveis Obrigatórias

#### SECRET_KEY
**Obrigatório** - Chave secreta do Django para criptografia e segurança.

```env
SECRET_KEY='sua-chave-secreta-aqui'
```

**Para gerar uma nova chave secreta:**
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

#### DEBUG
**Obrigatório** - Define se o modo debug está ativo.

```env
# Desenvolvimento
DEBUG=True

# Produção
DEBUG=False
```

## Configurações Opcionais

### Hosts Permitidos
```env
# Desenvolvimento (padrão)
ALLOWED_HOSTS=localhost,127.0.0.1

# Produção
ALLOWED_HOSTS=localhost,127.0.0.1,seudominio.com,www.seudominio.com
```

### Banco de Dados
```env
# SQLite (padrão - não precisa configurar)
# DATABASE_URL não definido = SQLite

# PostgreSQL
DATABASE_URL=postgresql://usuario:senha@localhost:5432/nome_do_banco

# MySQL
DATABASE_URL=mysql://usuario:senha@localhost:3306/nome_do_banco
```

### CORS e CSRF
```env
# Desenvolvimento (padrão)
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Produção
CORS_ALLOWED_ORIGINS=https://seudominio.com,https://www.seudominio.com
CSRF_TRUSTED_ORIGINS=https://seudominio.com,https://www.seudominio.com
```

### Configurações de Logging
```env
# Nível de log (DEBUG, INFO, WARNING, ERROR, CRITICAL)
LOG_LEVEL=INFO

# Tamanho máximo dos arquivos de log (em bytes)
LOG_FILE_MAX_SIZE=5242880  # 5MB

# Número de backups de log a manter
LOG_BACKUP_COUNT=5
```

### Configurações JWT
```env
# Tempo de vida do token de acesso (em minutos)
JWT_ACCESS_TOKEN_LIFETIME=60

# Tempo de vida do token de refresh (em minutos)
JWT_REFRESH_TOKEN_LIFETIME=1440  # 24 horas
```

### Configurações de Segurança (Produção)
```env
# HTTPS
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000  # 1 ano
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True

# Cookies seguros
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True

# Proteções de conteúdo
SECURE_CONTENT_TYPE_NOSNIFF=True
SECURE_BROWSER_XSS_FILTER=True
X_FRAME_OPTIONS=DENY
```

## Exemplos de Configuração

### Desenvolvimento Local
```env
SECRET_KEY='django-insecure-sua-chave-de-desenvolvimento'
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
LOG_LEVEL=DEBUG
```

### Produção
```env
SECRET_KEY='sua-chave-secreta-super-segura-para-producao'
DEBUG=False
ALLOWED_HOSTS=seudominio.com,www.seudominio.com
DATABASE_URL=postgresql://usuario:senha@localhost:5432/sgo_producao
CORS_ALLOWED_ORIGINS=https://seudominio.com
CSRF_TRUSTED_ORIGINS=https://seudominio.com
LOG_LEVEL=WARNING
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

## Verificação da Configuração

Para verificar se as configurações estão corretas:

```bash
# Verificar configurações do Django
python manage.py check

# Verificar configurações de deployment
python manage.py check --deploy

# Testar conexão com banco de dados
python manage.py migrate --dry-run
```

## Segurança

### ⚠️ Importantes Considerações de Segurança

1. **NUNCA** commite o arquivo `.env` no controle de versão
2. Use chaves secretas diferentes para desenvolvimento e produção
3. Em produção, sempre configure `DEBUG=False`
4. Use HTTPS em produção e configure as variáveis de segurança adequadamente
5. Mantenha as dependências atualizadas

### Backup das Configurações

- Mantenha um backup seguro das variáveis de ambiente de produção
- Use um gerenciador de senhas ou vault para armazenar credenciais sensíveis
- Documente as configurações específicas do ambiente de produção

## Troubleshooting

### Problemas Comuns

1. **Erro de SECRET_KEY**: Verifique se a variável está definida no .env
2. **Erro de CORS**: Verifique se o frontend está na lista de CORS_ALLOWED_ORIGINS
3. **Erro de banco de dados**: Verifique a string DATABASE_URL
4. **Problemas de HTTPS**: Verifique as configurações de segurança em produção

### Logs

Os logs são salvos em:
- `logs/debug.log` - Logs de debug e informações gerais
- `logs/error.log` - Logs de erro
- `logs/security.log` - Logs de segurança

## Suporte

Para mais informações sobre configurações do Django, consulte:
- [Documentação oficial do Django](https://docs.djangoproject.com/en/5.2/ref/settings/)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/)