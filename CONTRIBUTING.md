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