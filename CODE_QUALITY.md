# Documentação e Qualidade de Código - SGO

Este documento descreve as ferramentas e práticas de qualidade de código implementadas no projeto SGO (Sistema de Gestão de Obras).

## 📚 Documentação da API

### DRF Spectacular

A documentação da API REST é gerada automaticamente usando `drf-spectacular`.

**URLs disponíveis:**
- **Swagger UI**: `http://localhost:8000/api/docs/`
- **ReDoc**: `http://localhost:8000/api/redoc/`
- **Schema OpenAPI**: `http://localhost:8000/api/schema/`

**Configuração:**
- Instalado via `requirements.txt`
- Configurado em `settings.py`
- URLs definidas em `sgo_core/urls.py`

## 🐍 Backend - Python

### Black (Formatação de Código)

**Configuração:**
- Arquivo: `backend/pyproject.toml`
- Linha máxima: 88 caracteres
- Target: Python 3.12
- Exclui: migrações, venv, env

**Comandos:**
```bash
# Verificar formatação
python -m black --check .

# Aplicar formatação
python -m black .
```

### Flake8 (Linting)

**Configuração:**
- Arquivo: `backend/.flake8`
- Linha máxima: 88 caracteres
- Ignora: E203, W503 (compatibilidade com Black)
- Complexidade máxima: 10

**Comandos:**
```bash
# Verificar linting
python -m flake8 .
```

### Script Automatizado

Use o script `check_code_quality.py` para executar todas as verificações:

```bash
python check_code_quality.py
```

## ⚛️ Frontend - React

### Prettier (Formatação de Código)

**Configuração:**
- Arquivo: `frontend/.prettierrc`
- Semi-colons: true
- Single quotes: true
- Print width: 80
- Tab width: 2

**Comandos:**
```bash
# Verificar formatação
npm run format:check

# Aplicar formatação
npm run format
```

### ESLint (Linting)

Já configurado no projeto Vite.

**Comandos:**
```bash
# Verificar linting
npm run lint

# Corrigir problemas automaticamente
npm run lint:fix
```

## 🪝 Hooks de Pré-Commit

### Husky + lint-staged

**Configuração:**
- Husky configurado em `frontend/.husky/`
- lint-staged configurado em `package.json`

**Funcionamento:**
- Antes de cada commit, executa automaticamente:
  - ESLint com correção automática
  - Prettier para formatação
  - Apenas nos arquivos modificados (staged)

**Arquivos afetados:**
- `*.{js,jsx,ts,tsx}`: ESLint + Prettier
- `*.{json,css,md}`: Prettier

## 🚀 Fluxo de Trabalho Recomendado

### Backend (Python)
1. Desenvolva o código
2. Execute `python check_code_quality.py`
3. Corrija os problemas reportados
4. Commit das alterações

### Frontend (React)
1. Desenvolva o código
2. Execute `npm run lint:fix && npm run format`
3. Verifique com `npm run lint && npm run format:check`
4. Commit das alterações (hooks automáticos executarão)

## 📋 Checklist de Qualidade

### Backend
- [ ] Código formatado com Black
- [ ] Sem erros de linting (Flake8)
- [ ] Documentação da API atualizada
- [ ] Testes passando

### Frontend
- [ ] Código formatado com Prettier
- [ ] Sem erros de linting (ESLint)
- [ ] Componentes documentados
- [ ] Hooks de pré-commit funcionando

## 🛠️ Configurações Personalizadas

### Ignorar Arquivos

**Backend (.flake8):**
- Migrações Django
- Ambientes virtuais
- Cache Python

**Frontend (.prettierignore):**
- node_modules
- dist/build
- Arquivos de lock
- Arquivos de ambiente

## 📖 Recursos Adicionais

- [Black Documentation](https://black.readthedocs.io/)
- [Flake8 Documentation](https://flake8.pycqa.org/)
- [Prettier Documentation](https://prettier.io/docs/)
- [ESLint Documentation](https://eslint.org/docs/)
- [DRF Spectacular Documentation](https://drf-spectacular.readthedocs.io/)