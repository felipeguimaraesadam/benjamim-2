# Guia de Contribuição do Projeto

Bem-vindo ao nosso projeto! Este guia contém todas as informações necessárias para contribuir de forma eficaz e segura. O nosso principal ambiente de produção e testes está na [Render](https://render.com/), então todo o nosso fluxo de trabalho é otimizado para a nuvem.

## 📜 Sumário

1.  [Princípios Fundamentais](#-princípios-fundamentais)
2.  [Workflow de Desenvolvimento](#-workflow-de-desenvolvimento)
3.  [Política de Testes](#-política-de-testes)
4.  [Guia de Referência Rápida](#-guia-de-referência-rápida)
    *   [URLs dos Ambientes](#urls-dos-ambientes)
    *   [Configurações Críticas](#configurações-críticas)
5.  [Checklist para Merge em Produção](#-checklist-para-merge-em-produção)
6.  [Guia de Troubleshooting](#-guia-de-troubleshooting)

---

## 🔑 Princípios Fundamentais

1.  **Mindset Cloud-First**: O ambiente do Render é a nossa fonte da verdade. As configurações locais são para desenvolvimento, mas a validação final ocorre sempre na nuvem. Pense sempre: "Minha alteração funcionará no ambiente do Render?"

2.  **Branching Model**:
    *   `master`: Contém oódigo de produção. **Nunca trabalhe diretamente nesta branch**.
    *   `dev_main`: Nossa branch principal de desenvolvimento e integração. Todo o trabalho novo começa a partir daqui.
    *   **Branches de Feature**: Crie branches a partir de `dev_main` para novas funcionalidades ou correções (ex: `feat/nova-tela-login` ou `fix/bug-no-relatorio`).

---

## 🚀 Workflow de Desenvolvimento

Siga estes passos para garantir um ciclo de desenvolvimento seguro e eficiente.

```bash
# 1. Sincronize com a branch de desenvolvimento principal
git checkout dev_main
git pull origin dev_main

# 2. Crie uma nova branch para sua tarefa
git checkout -b feat/sua-nova-feature

# 3. Desenvolva e faça commits na sua branch
#    - Escreva seu código
#    - Rode testes locais para validar (ver Política de Testes)
git add .
git commit -m "feat: descreva sua funcionalidade"

# 4. Envie sua branch para o repositório remoto
git push origin feat/sua-nova-feature

# 5. Abra um Pull Request (PR)
#    - No GitHub, abra um PR da sua branch `feat/sua-nova-feature` para a `dev_main`.
#    - Descreva suas alterações e peça a revisão de um colega.

# 6. Após a aprovação do PR, faça o merge para dev_main
#    - O merge na dev_main acionará um deploy automático no ambiente de desenvolvimento do Render.
#    - Valide sua funcionalidade no ambiente de DEV (consulte as URLs de referência).

# 7. Merge para master (APENAS após validação em dev_main)
#    - Este passo deve ser feito com cuidado, seguindo o checklist de produção.
#    - Abra um PR de `dev_main` para `master`.
#    - Após a aprovação, o merge acionará o deploy em produção.
```

---

## 🔬 Política de Testes

Nossa política de testes equilibra agilidade e segurança.

### Testes Locais (Obrigatório para Desenvolvimento)

*   **O que fazer**: Rode testes unitários e de integração localmente para obter feedback rápido.
    ```bash
    # Exemplo para o backend
    pytest

    # Exemplo para o frontend
    npm test
    ```
*   **Servidor Local**: É incentivado rodar os servidores locais para desenvolvimento e testes manuais rápidos.
    ```bash
    # Backend
    python manage.py runserver

    # Frontend
    npm run dev
    ```
*   **Objetivo**: Garantir que sua lógica funciona e que você não quebrou funcionalidades existentes antes de enviar seu código.

### Testes no Ambiente de Desenvolvimento (Obrigatório antes de Produção)

*   **O que fazer**: Após o merge do seu PR para `dev_main`, um deploy automático será feito no ambiente de desenvolvimento do Render.
*   **Validação Obrigatória**: Você **deve** testar sua funcionalidade de ponta a ponta neste ambiente.
    *   Verifique a integração entre frontend e backend.
    *   Confirme se não há erros no console do navegador ou nos logs do Render.
*   **Objetivo**: Garantir que sua alteração funciona perfeitamente no ambiente real da nuvem antes de ir para produção.

---

## 📚 Guia de Referência Rápida

Consulte esta seção para encontrar rapidamente as URLs e configurações mais importantes.

### URLs dos Ambientes

| Ambiente        | Branch     | Frontend URL                               | Backend URL                                  |
| :-------------- | :--------- | :----------------------------------------- | :------------------------------------------- |
| **Produção**    | `master`   | https://frontend-s7jt.onrender.com         | https://django-backend-e7od.onrender.com     |
| **Desenvolvimento** | `dev_main` | https://frontend-s7jt-4cjk.onrender.com    | https://django-backend-e7od-4cjk.onrender.com|

### Configurações Críticas

Abaixo estão as configurações que exigem mais atenção ao mover código entre ambientes.

<details>
<summary><strong>Frontend: <code>frontend/.env.production</code></strong></summary>

Este arquivo define para qual API o frontend de produção aponta.

```env
# Garanta que a URL aponta para o backend de PRODUÇÃO
VITE_API_BASE_URL=https://django-backend-e7od.onrender.com
VITE_ENVIRONMENT=production
```
**Importante**: A URL da API **não** deve terminar com `/api`. O sufixo é adicionado pelo código.
</details>

<details>
<summary><strong>Backend: <code>backend/sgo_core/settings.py</code></strong></summary>

Este arquivo deve ser configurado para aceitar requisições de ambos os frontends (produção e desenvolvimento) para facilitar os testes.

```python
# Configuração recomendada para abranger ambos os ambientes
ALLOWED_HOSTS = [
    'django-backend-e7od.onrender.com',       # Produção
    'django-backend-e7od-4cjk.onrender.com',  # Desenvolvimento
    '*.onrender.com',
    'localhost',
    '127.0.0.1',
]

CORS_ALLOWED_ORIGINS = [
    "https://frontend-s7jt.onrender.com",       # Produção
    "https://frontend-s7jt-4cjk.onrender.com",  # Desenvolvimento
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

CSRF_TRUSTED_ORIGINS = [
    "https://frontend-s7jt.onrender.com",
    "https://frontend-s7jt-4cjk.onrender.com",
]
```
</details>

<details>
<summary><strong>Render: <code>render.yaml</code></strong></summary>

Este arquivo define a infraestrutura. Assegure-se de que os serviços de produção (`master`) estão apontando para as variáveis de ambiente e bancos de dados corretos no painel do Render.
</details>

---

## ✅ Checklist para Merge em Produção

**Siga este checklist rigorosamente antes de abrir um PR de `dev_main` para `master`.**

-   [ ] **Validação no Ambiente DEV**: A funcionalidade foi completamente testada no ambiente de desenvolvimento do Render (`dev_main`) e funciona como esperado.
-   [ ] **Logs Limpos**: Os logs dos serviços no Render (frontend e backend) não apresentam erros.
-   [ ] **Revisão de Configurações Críticas**:
    -   [ ] O arquivo `frontend/.env.production` aponta para a URL do backend de **produção**.
    -   [ ] O arquivo `backend/sgo_core/settings.py` contém as URLs de **produção** em `ALLOWED_HOSTS` e `CORS_ALLOWED_ORIGINS`.
-   [ ] **Pull Request Bem Documentado**: O PR de `dev_main` para `master` está claro, descrevendo as mudanças e o motivo do merge.
-   [ ] **Aprovação**: O PR foi revisado e aprovado por pelo menos um outro membro da equipe.

---

## 🛠️ Guia de Troubleshooting

<details>
<summary><strong>Erro 404 na API (URL duplicada: <code>/api/api/</code>)</strong></summary>

*   **Sintoma**: Frontend não consegue acessar endpoints da API.
*   **Causa Comum**: A variável `VITE_API_URL` no arquivo `.env` do frontend termina com uma barra (`/`), resultando em uma URL duplicada.
*   **Solução**: Remova a barra final.
    *   ✅ **Correto**: `VITE_API_URL=https://backend.onrender.com/api`
    *   ❌ **Errado**: `VITE_API_URL=https://backend.onrender.com/api/`
</details>

<details>
<summary><strong>Erro de CORS (Cross-Origin)</strong></summary>

*   **Sintoma**: O console do navegador exibe um erro de "CORS policy".
*   **Causa**: O backend não está configurado para aceitar requisições da URL do frontend.
*   **Solução**: Verifique se a URL do frontend (ex: `https://frontend-s7jt.onrender.com`) está presente na lista `CORS_ALLOWED_ORIGINS` no arquivo `settings.py` do backend.
</details>

<details>
<summary><strong>Erro 500 (Internal Server Error) no Backend</strong></summary>

*   **Sintoma**: A API retorna um erro 500.
*   **Diagnóstico**:
    1.  Acesse o painel do Render e verifique os **logs** do serviço de backend.
    2.  Procure por erros de conexão com o banco de dados, variáveis de ambiente ausentes ou erros de importação em Python.
</details>

<details>
<summary><strong>Frontend Não Carrega (Erro de Build)</strong></summary>

*   **Sintoma**: O site exibe uma página de erro do Render.
*   **Diagnóstico**:
    1.  No painel do Render, verifique os **logs de build** do serviço de frontend.
    2.  Procure por erros de `npm`, dependências ausentes no `package.json` ou falhas no comando de build (`vite build`).
</details>

<details>
<summary><strong>Comando de Emergência: Reverter Merge para Master</strong></summary>

Se um deploy em produção causar um problema crítico, reverta o merge imediatamente:

```bash
# Vá para a branch master
git checkout master

# Reverta para o commit anterior ao merge
git reset --hard HEAD~1

# Force o push para o repositório. Use --force-with-lease para segurança.
git push --force-with-lease origin master
```
</details>
