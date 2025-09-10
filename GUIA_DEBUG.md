# 🚨 GUIA DE DEBUG - SISTEMA SGO

## ✅ COMMIT E PUSH REALIZADOS
- ✅ Todas as alterações foram commitadas e enviadas para o repositório
- ✅ Deploy automático no Render foi iniciado
- ⏳ Aguarde 3-5 minutos para o deploy completar

---

## 🔧 COMO USAR O DEBUG MODE

### 1. ACESSO PRINCIPAL
**URL:** https://react-frontend-g55g.onrender.com/login

### 2. ATIVAR DEBUG MODE
1. Na tela de login, procure pelo botão **"🔍 Debug Mode"** (canto inferior)
2. Clique no botão para ativar
3. Você verá informações técnicas detalhadas na tela

### 3. TENTAR LOGIN NORMAL
- **Usuário:** admin
- **Senha:** admin123
- Observe as informações que aparecem no debug mode

---

## 🚪 ROTA DE BYPASS (SE LOGIN FALHAR)

**URL DIRETA:** https://react-frontend-g55g.onrender.com/debug-login

- Esta rota bypassa completamente a autenticação
- Deve dar acesso direto ao sistema
- Use apenas para testar se o problema é na autenticação

---

## 📋 O QUE REPORTAR SE DER ERRO

### 🖼️ SCREENSHOTS OBRIGATÓRIOS
1. **Tela de debug ativada** - com todas as informações técnicas visíveis
2. **Console do navegador** - pressione F12 → aba Console
3. **Aba Network** - F12 → aba Network → tentar login → screenshot das requisições

### 📝 INFORMAÇÕES ESPECÍFICAS PARA REPORTAR

#### ✅ Do Debug Mode:
- **Frontend URL mostrada**
- **Backend URL mostrada** 
- **Status da conexão**
- **Headers exibidos**
- **Variáveis de ambiente**
- **Mensagens de erro específicas**

#### ✅ Do Console (F12):
- **Erros em vermelho**
- **Warnings em amarelo**
- **Status codes das requisições (200, 404, 500, etc.)**
- **URLs das requisições que falharam**

#### ✅ Teste de Bypass:
- **A rota /debug-login funciona?** (Sim/Não)
- **Se funciona, o que aparece na tela?**
- **Se não funciona, qual erro aparece?**

---

## 📊 LOGS DO RENDER - COMO ACESSAR

### 1. ACESSAR DASHBOARD
1. Vá para: https://dashboard.render.com
2. Faça login na sua conta
3. Encontre os serviços:
   - **django-backend-e7od** (Backend)
   - **frontend-s7jt** (Frontend)

### 2. VER LOGS DO BACKEND
1. Clique em **django-backend-e7od**
2. Vá na aba **"Logs"**
3. Procure por:
   - `[DEBUG_LOGIN]` - logs de tentativa de login
   - `[CORS_DEBUG]` - problemas de CORS
   - `ERROR` - erros gerais
   - `500` - erros internos do servidor

### 3. VER LOGS DO FRONTEND
1. Clique em **frontend-s7jt**
2. Vá na aba **"Logs"**
3. Procure por erros de build ou runtime

---

## 🎯 CHECKLIST DE TESTE

### ✅ TESTE BÁSICO
- [ ] Site carrega: https://react-frontend-g55g.onrender.com/login
- [ ] Botão "Debug Mode" aparece
- [ ] Debug mode mostra informações técnicas
- [ ] Tentativa de login com admin/admin123

### ✅ TESTE DE BYPASS
- [ ] Rota bypass funciona: https://react-frontend-g55g.onrender.com/debug-login
- [ ] Se funciona, consegue acessar o sistema

### ✅ COLETA DE INFORMAÇÕES
- [ ] Screenshot do debug mode ativado
- [ ] Screenshot do console (F12)
- [ ] Screenshot da aba Network (F12)
- [ ] Logs do backend no Render
- [ ] Resultado do teste de bypass

---

## 🚨 SITUAÇÕES ESPECÍFICAS

### ❌ SE O SITE NÃO CARREGAR
**Reportar:**
- Erro exato que aparece
- Screenshot da tela
- Horário da tentativa

### ❌ SE DEBUG MODE NÃO APARECER
**Significa:** Frontend não foi atualizado ainda
**Ação:** Aguardar mais 2-3 minutos e recarregar

### ❌ SE LOGIN FALHAR MAS BYPASS FUNCIONAR
**Significa:** Problema na autenticação/CORS
**Foco:** Logs do backend, console do navegador

### ❌ SE AMBOS FALHAREM
**Significa:** Problema mais grave no backend
**Foco:** Logs do backend no Render

---

## 📞 FORMATO DE REPORTE

```
🔍 TESTE REALIZADO EM: [data/hora]

✅ SITE CARREGA: Sim/Não
✅ DEBUG MODE APARECE: Sim/Não  
✅ LOGIN FUNCIONA: Sim/Não
✅ BYPASS FUNCIONA: Sim/Não

📋 INFORMAÇÕES DO DEBUG:
- Frontend URL: [copiar do debug]
- Backend URL: [copiar do debug]
- Status conexão: [copiar do debug]
- Erro principal: [copiar mensagem]

🖼️ SCREENSHOTS:
- [anexar screenshot do debug]
- [anexar screenshot do console]
- [anexar screenshot network]

📊 LOGS RENDER:
- [copiar erros relevantes do backend]
```

---

## ⏰ PRÓXIMOS PASSOS

1. **Aguardar 3-5 minutos** para deploy completar
2. **Testar seguindo este guia**
3. **Reportar resultados** com screenshots e informações
4. **Analisar logs** se necessário
5. **Aplicar correções** baseadas nos dados coletados

**🎯 OBJETIVO:** Identificar exatamente onde está o problema para corrigi-lo rapidamente!