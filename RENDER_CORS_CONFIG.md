# Configuração de CORS no Render

## Problema Identificado
O login está falhando devido a erro de CORS. O frontend está tentando acessar o backend, mas as configurações de CORS não estão permitindo as requisições.

## URLs Corretas
- **Frontend**: `https://frontend-s7jt-4cjk.onrender.com`
- **Backend**: `https://django-backend-e7od-4cjk.onrender.com`

## Configurações Necessárias no Render

No painel do Render, para o serviço do backend Django, configure as seguintes variáveis de ambiente:

### Variáveis de Ambiente Obrigatórias:

```
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,https://frontend-s7jt-4cjk.onrender.com

CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,https://frontend-s7jt-4cjk.onrender.com

ALLOWED_HOSTS=127.0.0.1,localhost,django-backend-e7od-4cjk.onrender.com,*.onrender.com
```

### Como Configurar no Render:

1. Acesse o painel do Render
2. Vá para o serviço do backend Django
3. Clique em "Environment"
4. Adicione/edite as variáveis acima
5. Clique em "Save Changes"
6. O Render fará o redeploy automaticamente

### Verificação:

Após o deploy, teste o login no frontend. O erro de CORS deve ser resolvido.

### Logs para Debug:

Se ainda houver problemas, verifique os logs do backend no Render para identificar outros possíveis erros.