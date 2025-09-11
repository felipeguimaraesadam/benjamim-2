# Como Contribuir - Projeto Render 100% Online

⚠️ **ATENÇÃO: Este projeto está 100% online no Render. Mudanças locais NÃO importam para produção!**

## 🚨 Regras Fundamentais - NUNCA QUEBRAR

### 1. **JAMAIS trabalhe diretamente na branch master**
- Sempre crie uma branch de feature: `git checkout -b feature/nome-da-funcionalidade`
- Teste completamente antes de fazer merge
- Master deve sempre estar estável para deploy

### 2. **Mindset Cloud-First**
- O sistema roda no Render, não na sua máquina
- Configurações locais são apenas para desenvolvimento
- Sempre pense: "Isso vai funcionar na nuvem?"
- Nunca corrija o banco local achando que é o da nuvem

### 3. **Workflow Obrigatório**
```bash
# 1. Criar branch de feature
git checkout -b feature/minha-funcionalidade

# 2. Desenvolver e testar localmente
npm run dev  # Frontend
python manage.py runserver  # Backend

# 3. Testar que funciona tanto local quanto nuvem
# 4. Commit e push da branch
git add .
git commit -m "feat: descrição da funcionalidade"
git push origin feature/minha-funcionalidade

# 5. Merge para master APENAS após testes
git checkout master
git merge feature/minha-funcionalidade
git push origin master
```

## 🛠️ Configuração de Desenvolvimento

### Scripts de Desenvolvimento Local
- Use os scripts atualizados que não interferem na nuvem
- Ambiente local é isolado do ambiente de produção
- Configurações de desenvolvimento ficam em `.env.local`

### Banco de Dados
- **Local**: SQLite para desenvolvimento
- **Produção**: PostgreSQL no Render
- **NUNCA** modifique dados de produção diretamente

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

## ✅ Checklist Antes do Deploy

- [ ] Código testado localmente
- [ ] Funciona sem dependências locais
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados compatível com PostgreSQL
- [ ] Arquivos estáticos configurados
- [ ] URLs S3 funcionando
- [ ] Sem hardcode de paths locais
- [ ] Logs de erro limpos

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