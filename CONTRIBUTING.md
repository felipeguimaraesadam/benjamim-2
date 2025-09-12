# Como Contribuir - Projeto Render 100% Online

⚠️ **ATENÇÃO: Este projeto está 100% online no Render. Mudanças locais NÃO importam para produção!**

## 🚨 Regras Fundamentais - NUNCA QUEBRAR

### 1. **JAMAIS trabalhe diretamente na branch master**
- **NOVO WORKFLOW**: Todo desenvolvimento acontece na branch `dev_main`
- Master é apenas para código 100% testado e aprovado
- Branch dev_main será testada em deploy separado no Render
- Apenas após testes completos na nuvem, fazer merge dev_main → master

### 2. **Verificação Obrigatória do `render.yaml`**
- **CRÍTICO**: Antes de qualquer merge para `master`, revise o `render.yaml`.
- **Garanta que o `DATABASE_URL` aponta para o banco de produção (`sgo-postgres`)**.
- **Garanta que o `VITE_API_URL` aponta para a API de produção (`https://django-backend-e7od.onrender.com/api`)**.
- Um erro aqui pode conectar a aplicação de produção ao banco de dados de teste, causando perda de dados ou corrupção.

### 3. **Mindset Cloud-First**
- O sistema roda no Render, não na sua máquina
- Configurações locais são apenas para desenvolvimento
- Sempre pense: "Isso vai funcionar na nuvem?"
- Nunca corrija o banco local achando que é o da nuvem

### 4. **Workflow Obrigatório - NOVO SISTEMA**
```bash
# 1. Trabalhar sempre na branch dev_main
git checkout dev_main

# 2. Desenvolver e fazer commits diretos na dev_main
git add .
git commit -m "feat: descrição da funcionalidade"
git push origin dev_main

# 3. Testar no deploy de desenvolvimento (Render)
# - Deploy automático da branch dev_main
# - Testar todas as funcionalidades na nuvem
# - Validar integração completa

# 4. Merge para master APENAS após aprovação total
git checkout master
git merge dev_main
git push origin master
```

### 5. **🚨 POLÍTICA DE TESTES - APENAS NO DEPLOY DO RENDER**

⚠️ **REGRA ABSOLUTA: TESTES APENAS NO DEPLOY - NUNCA LOCALMENTE**

- **PROIBIDO**: Executar testes locais (pytest, npm test, etc.)
- **PROIBIDO**: Rodar servidor local para testes
- **PROIBIDO**: Configurar ambiente local para desenvolvimento
- **OBRIGATÓRIO**: Todos os testes devem ser feitos no deploy do Render
- **OBRIGATÓRIO**: Usar apenas URLs de produção/desenvolvimento do Render

#### Por que apenas no Render?
1. **Ambiente Real**: O Render é o ambiente de produção real
2. **Configurações Corretas**: Variáveis de ambiente, banco de dados e integrações reais
3. **Performance Real**: Testes locais não refletem a performance na nuvem
4. **Integração Completa**: Frontend e backend integrados no ambiente real

#### Workflow de Testes:
```bash
# 1. Fazer mudanças no código
git add .
git commit -m "fix: correção implementada"
git push origin dev_main

# 2. Aguardar deploy automático no Render (2-3 minutos)

# 3. Testar diretamente na URL do Render:
# - https://frontend-s7jt-4cjk.onrender.com (dev_main)
# - https://django-backend-e7od-4cjk.onrender.com (dev_main)

# 4. Se aprovado, fazer merge para master
```

#### ❌ NÃO FAZER:
- `python manage.py runserver`
- `npm run dev`
- `pytest`
- Configurar .env local
- Instalar dependências localmente para teste

#### ✅ FAZER:
- Commit e push direto
- Testar na URL do Render
- Verificar logs no dashboard do Render
- Validar funcionalidades na nuvem

## 🔄 Migração Entre Branches (dev_main → master)

### 📋 Visão Geral

Este guia fornece instruções detalhadas para migrar mudanças da branch `dev_main` para `master` no contexto do projeto deployado no Render, incluindo todas as configurações necessárias para URLs, CORS e variáveis de ambiente.

### 🌐 Configurações de Deploy por Branch

#### Branch dev_main (Desenvolvimento/Testes)
- **Backend URL**: `https://django-backend-e7od-4cjk.onrender.com`
- **Frontend URL**: `https://frontend-s7jt-4cjk.onrender.com`
- **Propósito**: Testes e validação de funcionalidades
- **Banco de Dados**: PostgreSQL de desenvolvimento

#### Branch master (Produção)
- **Backend URL**: `https://django-backend-e7od.onrender.com`
- **Frontend URL**: `https://frontend-s7jt.onrender.com`
- **Propósito**: Ambiente de produção
- **Banco de Dados**: PostgreSQL de produção

### ✅ Checklist de Migração dev_main → master

#### 1. **Preparação Pré-Migração**
- [ ] Validar que todas as funcionalidades estão funcionando na `dev_main`
- [ ] Confirmar que os testes estão passando
- [ ] Verificar se não há erros nos logs do Render
- [ ] Documentar as novas URLs que serão criadas para produção

#### 2. **Configurações do Backend**

##### 2.1 Atualizar ALLOWED_HOSTS
**Arquivo**: `backend/sgo_core/settings.py`

```python
# Configuração atual (dev_main)
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    'django-backend-e7od-4cjk.onrender.com',  # dev_main
    '*.onrender.com'
]

# Configuração para master (adicionar URL de produção)
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    'django-backend-e7od-4cjk.onrender.com',  # dev_main
    'django-backend-e7od.onrender.com',       # ADICIONAR: URL de produção
    '*.onrender.com'
]
```

##### 2.2 Configurações de CORS
**Arquivo**: `backend/sgo_core/settings.py`

```python
# Adicionar URL do frontend de produção
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://frontend-s7jt-4cjk.onrender.com",  # dev_main
    "https://frontend-s7jt.onrender.com",       # ADICIONAR: produção
]
```

#### 3. **Configurações do Frontend**

##### 3.1 Variáveis de Ambiente
**Arquivo**: `frontend/.env.production`

```env
# Atualizar para URL de produção
VITE_API_BASE_URL=https://django-backend-e7od.onrender.com
VITE_ENVIRONMENT=production
```

##### 3.2 Arquivos de Configuração da API
Verificar todos os arquivos que fazem referência à URL da API:
- `frontend/src/services/api.js`
- `frontend/src/utils/constants.js`
- Qualquer arquivo de configuração específico

#### 4. **Configurações no Render**

##### 4.1 Criar Novos Serviços para Produção
1. **Backend de Produção**:
   - Conectar à branch `master`
   - Configurar variáveis de ambiente de produção
   - Usar banco PostgreSQL de produção

2. **Frontend de Produção**:
   - Conectar à branch `master`
   - Configurar build command: `npm run build`
   - Configurar variáveis de ambiente apontando para backend de produção

##### 4.2 Variáveis de Ambiente por Ambiente

**Desenvolvimento (dev_main)**:
```
DEBUG=True
DATABASE_URL=[postgres-dev-url]
ALLOWED_HOSTS=django-backend-e7od-4cjk.onrender.com,*.onrender.com
```

**Produção (master)**:
```
DEBUG=False
DATABASE_URL=[postgres-prod-url]
ALLOWED_HOSTS=django-backend-e7od.onrender.com,*.onrender.com
SECRET_KEY=[chave-secreta-producao]
```

### 🔄 Processo Recomendado de Migração

#### Passo 1: Validação na dev_main
1. Fazer todas as mudanças na branch `dev_main`
2. Testar completamente no ambiente de desenvolvimento
3. Validar integração frontend-backend
4. Confirmar que não há erros nos logs

#### Passo 2: Preparação para Produção
1. Criar serviços de produção no Render (se ainda não existirem)
2. Configurar banco de dados de produção
3. Definir URLs finais de produção

#### Passo 3: Atualização de Configurações
1. Atualizar `ALLOWED_HOSTS` com URLs de produção
2. Atualizar configurações de CORS
3. Atualizar variáveis de ambiente do frontend
4. Fazer commit dessas mudanças na `dev_main`

#### Passo 4: Merge para Master
1. Criar Pull Request da `dev_main` para `master`
2. Revisar todas as mudanças
3. Fazer merge após aprovação
4. Aguardar deploy automático no Render

#### Passo 5: Validação Pós-Deploy
1. Testar aplicação em produção
2. Verificar logs de ambos os serviços
3. Confirmar comunicação frontend-backend
4. Testar funcionalidades críticas

### 🔧 TROUBLESHOOTING DE CONFIGURAÇÕES DO RENDER

### 🚨 Problemas Críticos de Configuração

#### 1. **Erro 404 na API (Problema Mais Comum)**

**Sintoma**: Frontend não consegue acessar endpoints da API

**Causa**: URL duplicada `/api/api/` em vez de `/api/`

**Solução**:
```bash
# Verificar arquivo .env.production no frontend
cat frontend/.env.production

# ✅ CORRETO:
VITE_API_URL=https://django-backend-e7od.onrender.com/api

# ❌ ERRADO:
VITE_API_URL=https://django-backend-e7od.onrender.com/api/
# (barra extra no final causa /api/api/)
```

**Teste**:
```bash
# Deve funcionar:
curl https://django-backend-e7od.onrender.com/api/token/

# Não deve funcionar:
curl https://django-backend-e7od.onrender.com/api/api/token/
```

#### 2. **Erro de CORS (Cross-Origin)**

**Sintoma**: Console do navegador mostra "CORS policy" error

**Causa**: Backend não aceita requests do frontend

**Solução**:
```python
# Verificar backend/sgo_core/settings.py
CORS_ALLOWED_ORIGINS = [
    "https://frontend-s7jt.onrender.com",  # PRODUÇÃO
    "https://frontend-s7jt-4cjk.onrender.com",  # DEV
]

# Também verificar:
ALLOWED_HOSTS = [
    'django-backend-e7od.onrender.com',
    'django-backend-e7od-4cjk.onrender.com',
    '*.onrender.com'
]
```

**Teste CORS**:
```bash
curl -H "Origin: https://frontend-s7jt.onrender.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://django-backend-e7od.onrender.com/api/token/
# Deve retornar headers Access-Control-Allow-*
```

#### 3. **Erro 500 no Backend**

**Sintoma**: API retorna Internal Server Error

**Diagnóstico**:
1. Acesse logs no Render Dashboard
2. Procure por:
   - Database connection errors
   - Missing environment variables
   - Import errors
   - ALLOWED_HOSTS errors

**Soluções Comuns**:
```bash
# 1. Verificar variáveis de ambiente no Render
# DATABASE_URL, DEBUG, ALLOWED_HOSTS, etc.

# 2. Verificar se todas as dependências estão no requirements.txt
pip freeze > requirements.txt

# 3. Testar migrações
# (No Render, via logs ou shell)
python manage.py migrate --check
```

#### 4. **Frontend Não Carrega (Erro de Build)**

**Sintoma**: Frontend mostra página de erro do Render

**Diagnóstico**:
1. Verificar logs de build no Render
2. Procurar por:
   - npm/yarn errors
   - Missing dependencies
   - Build command errors

**Soluções**:
```bash
# 1. Verificar package.json
# Confirmar se build command está correto
"scripts": {
  "build": "vite build",
  "preview": "vite preview"
}

# 2. Verificar se .env.production existe
ls frontend/.env.production

# 3. Testar build localmente (apenas para debug)
npm run build
```

### 🛠️ Comandos de Diagnóstico Avançado

#### Verificação Completa do Sistema:

```bash
#!/bin/bash
# Script de diagnóstico completo

echo "=== DIAGNÓSTICO DO SISTEMA ==="

# 1. Verificar serviços online
echo "1. Verificando serviços..."
curl -f -s https://django-backend-e7od.onrender.com/health/ && echo "✅ Backend OK" || echo "❌ Backend OFFLINE"
curl -f -s https://frontend-s7jt.onrender.com && echo "✅ Frontend OK" || echo "❌ Frontend OFFLINE"

# 2. Testar API endpoints
echo "2. Testando endpoints..."
curl -f -s https://django-backend-e7od.onrender.com/api/ && echo "✅ API OK" || echo "❌ API FALHOU"
curl -f -s https://django-backend-e7od.onrender.com/api/token/ -X POST && echo "✅ Token endpoint OK" || echo "❌ Token endpoint FALHOU"

# 3. Verificar CORS
echo "3. Testando CORS..."
CORS_RESPONSE=$(curl -s -H "Origin: https://frontend-s7jt.onrender.com" -I https://django-backend-e7od.onrender.com/api/)
if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo "✅ CORS OK"
else
    echo "❌ CORS FALHOU"
fi

# 4. Verificar configurações locais
echo "4. Verificando configurações locais..."
if [ -f "frontend/.env.production" ]; then
    echo "✅ .env.production existe"
    grep VITE_API_URL frontend/.env.production
else
    echo "❌ .env.production NÃO ENCONTRADO"
fi

echo "=== FIM DO DIAGNÓSTICO ==="
```

### 📋 Checklist de Troubleshooting

#### Quando algo não funciona:

1. **Primeiro, sempre verificar**:
   - [ ] Serviços estão online no Render Dashboard
   - [ ] Logs não mostram erros críticos
   - [ ] URLs estão corretas (sem `/api/api/`)
   - [ ] Branch correta está sendo usada

2. **Se login não funciona**:
   - [ ] Endpoint `/api/token/` responde
   - [ ] CORS configurado corretamente
   - [ ] Frontend aponta para backend correto
   - [ ] Credenciais de teste funcionam

3. **Se deploy falha**:
   - [ ] render.yaml está correto
   - [ ] Variáveis de ambiente configuradas
   - [ ] Dependencies atualizadas
   - [ ] Build commands corretos

### 🚨 Problemas de Emergência

#### Se o sistema está completamente quebrado:

1. **Reverter para última versão funcionando**:
```bash
git checkout master
git reset --hard HEAD~1  # Voltar 1 commit
git push --force-with-lease origin master
```

2. **Verificar status no Render**:
   - Acesse https://dashboard.render.com
   - Verifique se todos os serviços estão "Deployed"
   - Revise logs para identificar o problema

3. **Contato de emergência**:
   - Documente o erro com screenshots
   - Inclua logs relevantes
   - Descreva o que foi alterado antes do problema

### 📞 Quando Pedir Ajuda

**Sempre inclua estas informações**:
1. **Branch atual**: `git branch --show-current`
2. **Último commit**: `git log --oneline -1`
3. **Erro específico**: Screenshot ou texto completo
4. **Logs do Render**: Copie os logs relevantes
5. **O que foi alterado**: Descreva as mudanças recentes

### 🚨 Troubleshooting Comum

#### Erro: DisallowedHost
**Sintoma**: `Invalid HTTP_HOST header`
**Solução**: Adicionar a URL do Render ao `ALLOWED_HOSTS`

```python
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '[sua-url].onrender.com',
    '*.onrender.com'  # Permite qualquer subdomínio do Render
]
```

#### Erro: CORS
**Sintoma**: Requisições bloqueadas pelo navegador
**Solução**: Adicionar URL do frontend ao `CORS_ALLOWED_ORIGINS`

```python
CORS_ALLOWED_ORIGINS = [
    "https://[frontend-url].onrender.com",
]
```

#### Erro: URLs Incorretas no Frontend
**Sintoma**: Requisições para localhost em produção
**Solução**: Verificar variáveis de ambiente e arquivos de configuração

### 📝 Template de Checklist para Migração

```markdown
## Checklist de Migração - [Data]

### Pré-Migração
- [ ] Funcionalidades testadas na dev_main
- [ ] URLs de produção definidas
- [ ] Serviços de produção criados no Render

### Configurações Backend
- [ ] ALLOWED_HOSTS atualizado
- [ ] CORS_ALLOWED_ORIGINS atualizado
- [ ] Variáveis de ambiente configuradas

### Configurações Frontend
- [ ] .env.production atualizado
- [ ] URLs da API atualizadas
- [ ] Build testado localmente

### Deploy
- [ ] Pull Request criado
- [ ] Merge aprovado
- [ ] Deploy realizado com sucesso

### Pós-Deploy
- [ ] Aplicação funcionando em produção
- [ ] Logs verificados
- [ ] Funcionalidades críticas testadas
```

### 🔗 URLs de Referência

- **Render Documentation**: https://render.com/docs
- **Django ALLOWED_HOSTS**: https://docs.djangoproject.com/en/stable/ref/settings/#allowed-hosts
- **Django CORS**: https://github.com/adamchainz/django-cors-headers

## 🔧 CONFIGURAÇÕES DO RENDER POR BRANCH - GUIA COMPLETO

### 📍 URLs dos Serviços por Branch

#### Branch `dev_main` (Desenvolvimento)
- **Backend**: https://django-backend-e7od-4cjk.onrender.com
- **Frontend**: https://frontend-s7jt-4cjk.onrender.com
- **Banco**: sgo-postgres (compartilhado)
- **API Base URL**: `https://django-backend-e7od-4cjk.onrender.com/api`

#### Branch `master` (Produção)
- **Backend**: https://django-backend-e7od.onrender.com
- **Frontend**: https://frontend-s7jt.onrender.com
- **Banco**: sgo-postgres (compartilhado)
- **API Base URL**: `https://django-backend-e7od.onrender.com/api`

### 🔐 Configuração de Variáveis de Ambiente no Render

#### Como Configurar Variáveis no Dashboard do Render:

1. **Acesse o Dashboard**: https://dashboard.render.com
2. **Selecione o Serviço** (backend ou frontend)
3. **Vá para "Environment"**
4. **Adicione/Edite as variáveis necessárias**
5. **Clique em "Save Changes"**
6. **Aguarde o redeploy automático**

#### Variáveis Críticas por Serviço:

**Backend (Django):**
```env
# Produção (master)
DATABASE_URL=postgresql://...
DEBUG=False
ALLOWED_HOSTS=django-backend-e7od.onrender.com,*.onrender.com
CORS_ALLOWED_ORIGINS=https://frontend-s7jt.onrender.com
CSRF_TRUSTED_ORIGINS=https://frontend-s7jt.onrender.com

# Desenvolvimento (dev_main)
DATABASE_URL=postgresql://...
DEBUG=True
ALLOWED_HOSTS=django-backend-e7od-4cjk.onrender.com,*.onrender.com
CORS_ALLOWED_ORIGINS=https://frontend-s7jt-4cjk.onrender.com
CSRF_TRUSTED_ORIGINS=https://frontend-s7jt-4cjk.onrender.com
```

**Frontend (React/Vite):**
```env
# Produção (master)
VITE_API_URL=https://django-backend-e7od.onrender.com/api

# Desenvolvimento (dev_main)
VITE_API_URL=https://django-backend-e7od-4cjk.onrender.com/api
```

### 🔍 Como Verificar se as Configurações Estão Corretas

#### 1. **Verificação Automática via Comandos**

```bash
# Verificar configuração do frontend
curl -I https://frontend-s7jt.onrender.com
# Deve retornar 200 OK

# Verificar API do backend
curl -I https://django-backend-e7od.onrender.com/api/
# Deve retornar 200 OK

# Testar endpoint de token
curl -X POST https://django-backend-e7od.onrender.com/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
# Deve retornar resposta JSON (mesmo que credenciais inválidas)
```

#### 2. **Verificação Manual no Navegador**

1. **Abra o frontend**: https://frontend-s7jt.onrender.com
2. **Abra o Console do Navegador** (F12)
3. **Tente fazer login**
4. **Verifique se há erros de CORS**
5. **Confirme que as requisições vão para a URL correta**

#### 3. **Verificação de Logs no Render**

1. Acesse https://dashboard.render.com
2. Selecione o serviço
3. Vá para "Logs"
4. Procure por erros relacionados a:
   - CORS
   - ALLOWED_HOSTS
   - Database connection
   - 404 errors

### 🚨 DIFERENÇAS CRÍTICAS ENTRE AMBIENTES

#### Produção (master) vs Desenvolvimento (dev_main):

| Aspecto | Produção | Desenvolvimento |
|---------|----------|----------------|
| **DEBUG** | `False` | `True` |
| **CORS** | Restritivo | Mais permissivo |
| **Logs** | Mínimos | Detalhados |
| **Cache** | Ativado | Desativado |
| **SSL** | Obrigatório | Obrigatório |
| **Database** | Compartilhado | Compartilhado |

### 🛠️ Comandos de Diagnóstico

#### Para Identificar Problemas de Configuração:

```bash
# 1. Verificar se o serviço está online
curl -f https://django-backend-e7od.onrender.com/health/ || echo "Backend offline"
curl -f https://frontend-s7jt.onrender.com || echo "Frontend offline"

# 2. Testar CORS
curl -H "Origin: https://frontend-s7jt.onrender.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://django-backend-e7od.onrender.com/api/token/

# 3. Verificar resposta da API
curl -s https://django-backend-e7od.onrender.com/api/ | head -c 100
```

### 📋 Checklist de Configuração por Branch

#### Ao Trabalhar na dev_main:
- [ ] `VITE_API_URL` aponta para backend de dev
- [ ] Backend aceita requests do frontend de dev
- [ ] CORS configurado para URLs de dev
- [ ] DEBUG=True no backend

#### Ao Fazer Merge para master:
- [ ] `VITE_API_URL` aponta para backend de produção
- [ ] Backend aceita requests do frontend de produção
- [ ] CORS configurado para URLs de produção
- [ ] DEBUG=False no backend
- [ ] Todas as variáveis de ambiente atualizadas

### 🛠️ Configuração de Desenvolvimento

### Ambiente de Desenvolvimento
- **Branch dev_main**: Deploy automático no Render para testes
- **Branch master**: Produção final
- **Testes locais**: Apenas para desenvolvimento inicial
- **Testes reais**: Sempre no ambiente Render (dev_main)

### Banco de Dados
- **Desenvolvimento (dev_main)**: PostgreSQL no Render (ambiente de teste)
- **Produção (master)**: PostgreSQL no Render (ambiente final)
- **Local**: Apenas para desenvolvimento inicial (não é ambiente de teste)

### 🔧 Configuração de Desenvolvimento Local (Apenas para Referência)

⚠️ **IMPORTANTE**: Desenvolvimento local é PROIBIDO. Use apenas o Render.

Esta seção é apenas para referência técnica:

## 📋 Sistema de Backup e Migração

### Upload de Banco Antigo
1. Acesse `/backup` no sistema
2. Faça upload do arquivo `db.sqlite3` do cliente
3. Sistema verifica duplicatas automaticamente
4. Apenas dados novos são integrados

### Verificação de Duplicatas
- Sistema compara registros existentes
- Evita duplicação de dados
- Gera relatório de importação

## 📝 Controle de Tarefas

### Arquivo implementar.md
- Sempre manter últimas 5 semanas/tarefas
- Documentar o que foi feito
- Incluir links para commits relevantes
- Atualizar após cada implementação

## ☁️ Sistema de Anexos AWS S3

### Migração de Arquivos
- Anexos devem ser migrados para S3
- Código de integração já existe
- Testar migração em ambiente de desenvolvimento
- Validar URLs S3 antes do deploy

## 🚫 O Que NUNCA Fazer

1. **Trabalhar diretamente na master**
2. **Deixar arquivos de teste no repositório**
3. **Fazer mudanças que só funcionam localmente**
4. **Corrigir banco local achando que é produção**
5. **Deploy sem testar completamente**
6. **Hardcode de configurações locais**
7. **Ignorar erros de deploy**

## 🚨 CHECKLIST CRÍTICO DE MERGE PARA MASTER - À PROVA DE FALHAS

⚠️ **ATENÇÃO: Este checklist é OBRIGATÓRIO e deve ser seguido rigorosamente para evitar acidentes em produção!**

### 🔒 VERIFICAÇÕES DE SEGURANÇA OBRIGATÓRIAS

#### 1. **Configurações de URL - CRÍTICO**
- [ ] **Frontend `.env.production`**: Verificar se `VITE_API_URL` aponta para produção
  ```env
  # ✅ CORRETO para master:
  VITE_API_URL=https://django-backend-e7od.onrender.com/api
  
  # ❌ ERRADO (dev_main):
  VITE_API_URL=https://django-backend-e7od-4cjk.onrender.com/api
  ```

- [ ] **Backend `settings.py`**: Verificar configurações de produção
  ```python
  # ✅ ALLOWED_HOSTS deve incluir URL de produção:
  ALLOWED_HOSTS = [
      'django-backend-e7od.onrender.com',  # PRODUÇÃO
      'django-backend-e7od-4cjk.onrender.com',  # DEV
      '*.onrender.com'
  ]
  
  # ✅ CORS_ALLOWED_ORIGINS deve incluir frontend de produção:
  CORS_ALLOWED_ORIGINS = [
      "https://frontend-s7jt.onrender.com",  # PRODUÇÃO
      "https://frontend-s7jt-4cjk.onrender.com",  # DEV
  ]
  
  # ✅ CSRF_TRUSTED_ORIGINS deve incluir ambos:
  CSRF_TRUSTED_ORIGINS = [
      "https://frontend-s7jt.onrender.com",  # PRODUÇÃO
      "https://frontend-s7jt-4cjk.onrender.com",  # DEV
  ]
  ```

#### 2. **Teste de Endpoints Críticos - OBRIGATÓRIO**
- [ ] **Testar login na dev_main**: `https://frontend-s7jt-4cjk.onrender.com/login`
- [ ] **Verificar API de token**: `https://django-backend-e7od-4cjk.onrender.com/api/token/`
- [ ] **Confirmar CORS funcionando**: Sem erros no console do navegador
- [ ] **Testar upload de arquivos**: Se aplicável
- [ ] **Verificar conexão com banco**: Dados carregando corretamente

#### 3. **Verificação do render.yaml - CRÍTICO**
- [ ] **Confirmar configurações de produção no render.yaml**
- [ ] **Verificar se DATABASE_URL aponta para banco correto**
- [ ] **Confirmar variáveis de ambiente de produção**

#### 4. **Comandos de Verificação Obrigatórios**

Antes do merge, execute estes comandos para verificar configurações:

```bash
# 1. Verificar branch atual
git branch --show-current
# Deve mostrar: dev_main

# 2. Verificar se há mudanças não commitadas
git status
# Deve mostrar: working tree clean

# 3. Verificar últimos commits
git log --oneline -5
# Revisar se todos os commits estão corretos

# 4. Verificar diferenças com master
git diff master..dev_main --name-only
# Revisar todos os arquivos que serão alterados
```

#### 5. **Verificação de Arquivos de Configuração**
- [ ] **frontend/.env.production**: URLs corretas para produção
- [ ] **backend/sgo_core/settings.py**: ALLOWED_HOSTS, CORS, CSRF corretos
- [ ] **render.yaml**: Configurações de produção
- [ ] **Sem arquivos de teste**: Verificar se não há arquivos .test, .debug, etc.

### 🛡️ PROTEÇÃO DO BANCO DE DADOS

#### Verificações de Segurança do Banco:
- [ ] **Confirmar que DATABASE_URL no Render aponta para banco de produção**
- [ ] **Verificar se não há scripts de reset/drop no código**
- [ ] **Confirmar que migrações são seguras (não destrutivas)**
- [ ] **Backup do banco antes do deploy** (se mudanças críticas)

#### Como Verificar Configuração do Banco:
1. Acesse o dashboard do Render
2. Vá para o serviço de backend de produção
3. Verifique a variável `DATABASE_URL`
4. Confirme que aponta para o banco correto (não o de desenvolvimento)

### 📋 CHECKLIST GERAL DE MERGE

- [ ] Código commitado na branch dev_main
- [ ] Deploy de desenvolvimento funcionando no Render
- [ ] **TODAS as verificações de segurança acima concluídas**
- [ ] Todas as funcionalidades testadas na nuvem
- [ ] Sistema de backup testado
- [ ] Sistema de anexos S3 funcionando
- [ ] APIs respondendo corretamente
- [ ] Frontend carregando sem erros
- [ ] Banco de dados funcionando (PostgreSQL)
- [ ] Logs de erro limpos no ambiente dev_main
- [ ] **URLs de produção testadas e funcionando**
- [ ] **Configurações de CORS validadas**
- [ ] **Endpoints críticos testados**
- [ ] Aprovação final para merge dev_main → master

### 🚨 COMANDOS DE EMERGÊNCIA

Se algo der errado após o merge:

```bash
# 1. Reverter merge imediatamente
git checkout master
git reset --hard HEAD~1
git push --force-with-lease origin master

# 2. Voltar para dev_main para correções
git checkout dev_main

# 3. Verificar logs do Render para identificar problema
# Acesse: https://dashboard.render.com
```

### ⚠️ AVISOS CRÍTICOS

1. **NUNCA faça merge sem completar TODAS as verificações acima**
2. **SEMPRE teste os endpoints críticos antes do merge**
3. **CONFIRME as URLs de produção antes de fazer push**
4. **Em caso de dúvida, NÃO faça o merge - peça ajuda**
5. **Mantenha backup do banco antes de mudanças críticas**

## 📚 RESUMO EXECUTIVO - CONFIGURAÇÕES CRÍTICAS

### 🎯 URLs Corretas por Ambiente

| Ambiente | Frontend | Backend | API Base |
|----------|----------|---------|----------|
| **Produção (master)** | https://frontend-s7jt.onrender.com | https://django-backend-e7od.onrender.com | `/api` |
| **Desenvolvimento (dev_main)** | https://frontend-s7jt-4cjk.onrender.com | https://django-backend-e7od-4cjk.onrender.com | `/api` |

### 🔧 Configurações Essenciais

#### Frontend (.env.production):
```env
# PRODUÇÃO:
VITE_API_URL=https://django-backend-e7od.onrender.com/api

# DESENVOLVIMENTO:
VITE_API_URL=https://django-backend-e7od-4cjk.onrender.com/api
```

#### Backend (settings.py):
```python
# Sempre incluir AMBOS os ambientes:
ALLOWED_HOSTS = [
    'django-backend-e7od.onrender.com',      # PRODUÇÃO
    'django-backend-e7od-4cjk.onrender.com', # DEV
    '*.onrender.com'
]

CORS_ALLOWED_ORIGINS = [
    "https://frontend-s7jt.onrender.com",      # PRODUÇÃO
    "https://frontend-s7jt-4cjk.onrender.com", # DEV
]

CSRF_TRUSTED_ORIGINS = [
    "https://frontend-s7jt.onrender.com",      # PRODUÇÃO
    "https://frontend-s7jt-4cjk.onrender.com", # DEV
]
```

### ⚡ Verificação Rápida (30 segundos)

```bash
# 1. Verificar se serviços estão online
curl -I https://django-backend-e7od.onrender.com/api/
curl -I https://frontend-s7jt.onrender.com

# 2. Testar endpoint crítico
curl -X POST https://django-backend-e7od.onrender.com/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"test":"test"}'

# 3. Verificar configuração local
grep VITE_API_URL frontend/.env.production
```

### 🚨 Sinais de Alerta

**❌ PARE IMEDIATAMENTE se encontrar**:
- URLs com `/api/api/` (duplicação)
- CORS errors no console do navegador
- 404 errors em endpoints que deveriam funcionar
- Backend retornando 500 errors
- Frontend não carregando

**✅ Tudo OK quando**:
- Login funciona sem erros de CORS
- API responde corretamente
- Console do navegador limpo
- Logs do Render sem erros críticos

### 🎯 Exemplo Prático de Verificação Completa

#### Cenário: Verificar se dev_main está pronta para merge

```bash
# 1. Confirmar branch
git branch --show-current
# Deve mostrar: dev_main

# 2. Testar frontend de desenvolvimento
open https://frontend-s7jt-4cjk.onrender.com
# Deve carregar sem erros

# 3. Testar login na dev_main
# Ir para: https://frontend-s7jt-4cjk.onrender.com/login
# Tentar fazer login
# Console do navegador deve estar limpo

# 4. Verificar configuração para produção
cat frontend/.env.production
# Deve mostrar: VITE_API_URL=https://django-backend-e7od.onrender.com/api

# 5. Verificar backend settings
grep -A 10 "ALLOWED_HOSTS" backend/sgo_core/settings.py
# Deve incluir ambas as URLs (produção e dev)

# 6. Testar API de produção
curl https://django-backend-e7od.onrender.com/api/token/
# Deve retornar resposta JSON

# 7. Se tudo OK, pode fazer merge
git checkout master
git merge dev_main
git push origin master
```

### 📋 Template de Checklist Rápido

**Copie e cole este checklist antes de cada merge**:

```
## Checklist de Merge - [DATA]

### Configurações:
- [ ] frontend/.env.production aponta para produção
- [ ] backend/settings.py inclui ambos os ambientes
- [ ] Sem URLs duplicadas (/api/api/)

### Testes:
- [ ] Login funciona na dev_main
- [ ] API responde corretamente
- [ ] Console do navegador limpo
- [ ] Logs do Render sem erros

### Verificação Final:
- [ ] Todos os arquivos commitados
- [ ] Branch dev_main funcionando 100%
- [ ] Configurações de produção validadas

### Aprovação:
- [ ] Merge aprovado por: [NOME]
- [ ] Data/hora do merge: [DATA/HORA]
```

## 🐛 Reportando Bugs

Utilize o template de [bug report](/.github/ISSUE_TEMPLATE/bug_report.md) para reportar bugs.

**Informações obrigatórias:**
- Ambiente (local/produção)
- Logs de erro completos
- Passos para reproduzir
- Comportamento esperado vs atual

## 💡 Sugerindo Funcionalidades

Utilize o template de [feature request](/.github/ISSUE_TEMPLATE/feature_request.md) para sugerir novas funcionalidades.

## 🔄 Pull Requests

Utilize o template de [pull request](/.github/PULL_REQUEST_TEMPLATE.md) para propor alterações no código.

**Requisitos obrigatórios:**
- Branch de feature (não master)
- Testes locais completos
- Compatibilidade com Render
- Documentação atualizada
- Sem arquivos de teste

## 📞 Suporte

Em caso de dúvidas sobre o workflow ou problemas de deploy, consulte este documento primeiro. Ele contém todas as práticas essenciais para manter o projeto estável e funcionando 100% na nuvem.