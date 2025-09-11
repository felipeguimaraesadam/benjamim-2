# Como Contribuir - Projeto Render 100% Online

⚠️ **ATENÇÃO: Este projeto está 100% online no Render. Mudanças locais NÃO importam para produção!**

## 🚨 Regras Fundamentais - NUNCA QUEBRAR

### 1. **JAMAIS trabalhe diretamente na branch master**
- **NOVO WORKFLOW**: Todo desenvolvimento acontece na branch `dev_main`
- Master é apenas para código 100% testado e aprovado
- Branch dev_main será testada em deploy separado no Render
- Apenas após testes completos na nuvem, fazer merge dev_main → master

### 2. **Mindset Cloud-First**
- O sistema roda no Render, não na sua máquina
- Configurações locais são apenas para desenvolvimento
- Sempre pense: "Isso vai funcionar na nuvem?"
- Nunca corrija o banco local achando que é o da nuvem

### 3. **Workflow Obrigatório - NOVO SISTEMA**
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

## 🛠️ Configuração de Desenvolvimento

### Ambiente de Desenvolvimento
- **Branch dev_main**: Deploy automático no Render para testes
- **Branch master**: Produção final
- **Testes locais**: Apenas para desenvolvimento inicial
- **Testes reais**: Sempre no ambiente Render (dev_main)

### Banco de Dados
- **Desenvolvimento (dev_main)**: PostgreSQL no Render (ambiente de teste)
- **Produção (master)**: PostgreSQL no Render (ambiente final)
- **Local**: Apenas para desenvolvimento inicial (não é ambiente de teste)

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

## ✅ Checklist Antes do Merge para Master

- [ ] Código commitado na branch dev_main
- [ ] Deploy de desenvolvimento funcionando no Render
- [ ] Todas as funcionalidades testadas na nuvem
- [ ] Sistema de backup testado
- [ ] Sistema de anexos S3 funcionando
- [ ] APIs respondendo corretamente
- [ ] Frontend carregando sem erros
- [ ] Banco de dados funcionando (PostgreSQL)
- [ ] Logs de erro limpos no ambiente dev_main
- [ ] Aprovação final para merge dev_main → master

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