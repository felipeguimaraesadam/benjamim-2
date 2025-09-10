# PLANO DE TESTE PERFEITO - RENDER DEPLOY

## ⏰ AGUARDE 5 MINUTOS APÓS O PUSH
O deploy automático no Render leva de 3-5 minutos. Aguarde antes de iniciar os testes.

---

## 🧪 TESTE 1: CONECTIVIDADE BÁSICA
**Objetivo:** Verificar se o frontend carrega sem erro 404

### Passos:
1. Acesse: https://react-frontend-g55g.onrender.com
2. Aguarde o carregamento completo
3. Verifique se aparece a tela de login (não erro 404)

### ✅ Resultado Esperado:
- Página carrega normalmente
- Aparece formulário de login
- Não há erro 404

### ❌ Se der erro, reporte:
- Screenshot da tela
- Mensagem de erro exata
- Status code (aba Network do F12)

---

## 🧪 TESTE 2: BACKEND HEALTH CHECK
**Objetivo:** Verificar se o backend e banco estão funcionando

### Passos:
1. Acesse: https://django-backend-e7od.onrender.com/health/
2. Verifique o JSON retornado
3. Confirme status 200

### ✅ Resultado Esperado:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "...",
  "version": "1.0.0"
}
```

### ❌ Se der erro, reporte:
- Status code retornado
- Conteúdo da resposta
- Screenshot da página

---

## 🧪 TESTE 3: PÁGINA DE DIAGNÓSTICO
**Objetivo:** Verificar conectividade frontend-backend

### Passos:
1. Acesse: https://react-frontend-g55g.onrender.com/diagnostico
2. Aguarde todos os testes executarem
3. Verifique se todos ficam verdes (✅)

### ✅ Resultado Esperado:
- ✅ Frontend Status: OK
- ✅ Backend Connectivity: OK  
- ✅ Database Status: OK
- ✅ CORS Configuration: OK

### ❌ Se der erro, reporte:
- Quais testes falharam (ficaram vermelhos)
- Mensagens de erro específicas
- Console do navegador (F12 → Console)

---

## 🧪 TESTE 4: LOGIN FUNCIONAL
**Objetivo:** Testar login sem erros de CORS

### Passos:
1. Na tela de login: https://react-frontend-g55g.onrender.com
2. Digite:
   - **Usuário:** admin
   - **Senha:** admin123
3. Clique em "Entrar"
4. Observe o comportamento

### ✅ Resultado Esperado:
- Login processa sem erro
- Não há erros de CORS no console
- Redireciona para dashboard ou página principal

### ❌ Se der erro, reporte:
- Mensagem de erro na tela
- Erros no console (F12 → Console)
- Erros na aba Network (F12 → Network)
- Se ficou na tela de login ou redirecionou

---

## 📋 COMO REPORTAR RESULTADOS

### ✅ Se tudo funcionou:
"Todos os 4 testes passaram! Sistema funcionando perfeitamente no Render."

### ❌ Se algo falhou:
Para cada teste que falhou, informe:

1. **Número do teste que falhou** (1, 2, 3 ou 4)
2. **Screenshot da tela**
3. **Console do navegador** (F12 → Console → copie as mensagens de erro)
4. **Aba Network** (F12 → Network → status codes das requisições)
5. **Comportamento observado vs esperado**

### 🔍 Como abrir o Console:
1. Pressione F12 no navegador
2. Clique na aba "Console"
3. Copie todas as mensagens em vermelho
4. Clique na aba "Network"
5. Recarregue a página
6. Verifique status codes (200 = OK, 404 = não encontrado, 500 = erro servidor)

---

## ⚡ RESUMO RÁPIDO
1. **Aguarde 5 minutos** após o push
2. **Teste 1:** https://react-frontend-g55g.onrender.com (deve carregar)
3. **Teste 2:** https://django-backend-e7od.onrender.com/health/ (deve retornar JSON)
4. **Teste 3:** https://react-frontend-g55g.onrender.com/diagnostico (tudo verde)
5. **Teste 4:** Login com admin/admin123 (deve funcionar)

**Reporte o resultado de cada teste na ordem!**