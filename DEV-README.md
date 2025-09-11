# Guia de Desenvolvimento Local - SGO

Este guia explica como configurar e executar o projeto SGO (Sistema de Gestão de Obras) localmente para desenvolvimento.

## 📋 Pré-requisitos

- **Python 3.8+** - Para o backend Django
- **Node.js 16+** - Para o frontend React
- **Git** - Para controle de versão

## 🚀 Configuração Rápida

### Opção 1: Script Automático (Recomendado)

```bash
# Configurar todo o ambiente automaticamente
python dev-scripts.py setup
```

Este comando irá:
- ✅ Verificar dependências
- ✅ Criar virtual environment para Python
- ✅ Instalar dependências do backend
- ✅ Instalar dependências do frontend
- ✅ Executar migrações do banco de dados
- ✅ Criar superusuário padrão (admin/admin123)
- ✅ Mostrar instruções para iniciar os servidores

### Opção 2: Configuração Manual

#### Backend (Django)

```bash
# Navegar para o diretório do backend
cd backend

# Criar virtual environment
python -m venv venv

# Ativar virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Executar migrações
python manage.py makemigrations
python manage.py migrate

# Criar superusuário
python manage.py createsuperuser
```

#### Frontend (React)

```bash
# Navegar para o diretório do frontend
cd frontend

# Instalar dependências
npm install
```

## 🏃‍♂️ Executando o Projeto

### Iniciar Servidores de Desenvolvimento

Abra **dois terminais separados**:

**Terminal 1 - Backend:**
```bash
cd backend
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

python manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### URLs de Acesso

- **Frontend:** http://localhost:3000
- **Backend API:** http://127.0.0.1:8000
- **Admin Django:** http://127.0.0.1:8000/admin

### Credenciais Padrão

- **Login:** admin
- **Senha:** admin123

## 🛠️ Scripts de Desenvolvimento

### Comandos Disponíveis

```bash
# Configurar ambiente completo
python dev-scripts.py setup

# Limpar ambiente (remove venv e node_modules)
python dev-scripts.py clean

# Mostrar instruções para iniciar servidores
python dev-scripts.py start
```

### Scripts do Frontend

```bash
cd frontend

# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Linting
npm run lint
npm run lint:fix

# Formatação
npm run format
npm run format:check
```

### Scripts do Backend

```bash
cd backend

# Ativar virtual environment primeiro
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

# Servidor de desenvolvimento
python manage.py runserver

# Migrações
python manage.py makemigrations
python manage.py migrate

# Shell interativo
python manage.py shell

# Coletar arquivos estáticos
python manage.py collectstatic
```

## 🏗️ Estrutura do Projeto

```
sgo/
├── backend/                 # Django backend
│   ├── core/               # App principal
│   ├── sgo_core/           # Configurações Django
│   ├── requirements.txt    # Dependências Python
│   └── manage.py          # Django management
├── frontend/               # React frontend
│   ├── src/               # Código fonte
│   ├── public/            # Arquivos públicos
│   └── package.json       # Dependências Node.js
├── dev-scripts.py         # Scripts de desenvolvimento
└── DEV-README.md          # Este arquivo
```

## 🔧 Funcionalidades Principais

### Sistema de Anexos S3
- Upload de arquivos para AWS S3
- Migração de anexos locais para S3
- Gerenciamento de permissões

### Sistema de Backup
- Backup automático do banco de dados
- Upload para S3
- Verificação de duplicatas
- Histórico de backups

### Controle de Tarefas
- Rastreamento de tarefas do sistema
- Histórico de execuções
- Monitoramento de status

### Gerenciamento de Branches
- Interface para gerenciar branches Git
- Visualização de status
- Operações básicas de Git

## 🐛 Solução de Problemas

### Erro de Dependências

```bash
# Limpar e reinstalar
python dev-scripts.py clean
python dev-scripts.py setup
```

### Erro de Migrações

```bash
cd backend
python manage.py makemigrations --empty core
python manage.py migrate
```

### Erro de Porta em Uso

```bash
# Verificar processos usando as portas
# Windows:
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# Linux/Mac:
lsof -i :3000
lsof -i :8000
```

### Problemas com Virtual Environment

```bash
# Recriar virtual environment
cd backend
rm -rf venv  # Linux/Mac
rmdir /s venv  # Windows
python -m venv venv
```

## 📝 Desenvolvimento

### Adicionando Novas Funcionalidades

1. **Backend (Django):**
   - Criar modelos em `backend/core/models.py`
   - Criar serializers em `backend/core/serializers.py`
   - Criar views em `backend/core/views.py`
   - Adicionar URLs em `backend/core/urls.py`

2. **Frontend (React):**
   - Criar componentes em `frontend/src/components/`
   - Criar páginas em `frontend/src/pages/`
   - Adicionar rotas em `frontend/src/App.jsx`

### Padrões de Código

- **Backend:** Seguir PEP 8 para Python
- **Frontend:** Usar ESLint e Prettier (configurados)
- **Commits:** Usar mensagens descritivas

### Testes

```bash
# Backend
cd backend
python manage.py test

# Frontend
cd frontend
npm test
```

## 🚀 Deploy

Este projeto está configurado para deploy no **Render**. Os scripts de desenvolvimento não interferem no processo de deploy em produção.

### Variáveis de Ambiente

Configure as seguintes variáveis no Render:

- `DATABASE_URL` - URL do banco PostgreSQL
- `AWS_ACCESS_KEY_ID` - Chave de acesso AWS
- `AWS_SECRET_ACCESS_KEY` - Chave secreta AWS
- `AWS_STORAGE_BUCKET_NAME` - Nome do bucket S3
- `SECRET_KEY` - Chave secreta Django
- `DEBUG` - False para produção

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique este README
2. Execute `python dev-scripts.py setup` novamente
3. Consulte os logs de erro nos terminais
4. Verifique a documentação do Django e React

---

**Nota:** Este ambiente de desenvolvimento é otimizado para funcionar localmente sem interferir no deploy em produção no Render.