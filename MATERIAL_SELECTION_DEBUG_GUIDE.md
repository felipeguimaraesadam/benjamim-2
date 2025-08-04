# Guia de Debug - Problema de Seleção de Material

## 🚨 Problema Reportado
O aviso "Material é obrigatório" persiste mesmo após selecionar um material usando as setas e Enter/Tab.

## 🔍 Ferramentas de Debug Criadas

### 1. Debug Panel (Interface Visual)
- **Localização**: Canto superior direito da tela quando o formulário está aberto
- **Funções**: Mostra estado em tempo real dos itens e erros
- **Botão "Log State"**: Imprime no console o estado completo atual

### 2. Teste Automatizado
- **Arquivo**: `test_material_selection.js`
- **Uso**: Execute no console do navegador
- **Comandos**:
  ```javascript
  // Teste completo
  window.runMaterialTests()
  
  // Debug rápido
  window.quickMaterialDebug()
  ```

### 3. Teste Isolado do Componente
- **Arquivo**: `MaterialAutocompleteTest.html`
  - Abra diretamente no navegador
  - Teste o componente sem complexidade do formulário
  - Console mostra logs detalhados

### 4. Logs Detalhados
Logs foram adicionados em:
- `MaterialAutocomplete.jsx` - para rastrear seleção
- `compraform.jsx` - para rastrear validação

## 🧪 Passos para Testar

### Teste 1: Verificação Visual
1. Abra o formulário de compra
2. Olhe o Debug Panel no canto superior direito
3. Observe os valores de:
   - `First Item Material`
   - `Material Errors`

### Teste 2: Teste Automatizado
1. Abra o console (F12)
2. Cole e execute:
   ```javascript
   fetch('test_material_selection.js')
     .then(r => r.text())
     .then(eval)
     .then(() => window.runMaterialTests())
   ```
3. Observe os resultados no console

### Teste 3: Teste Manual com Logs
1. Abra o console
2. Digite "areia" no campo material
3. Use setas para selecionar "AREIA"
4. Pressione Enter ou Tab
5. Observe os logs no console:
   - "🧪 MaterialAutocomplete: Suggestion clicked"
   - "🔍 DEBUG: handleItemFieldBlur scheduled"
   - "🔍 DEBUG: Validating material after delay"

## 📊 Interpretando Resultados

### Se o erro persiste:
1. **Verifique o console** - há logs de "🧪" e "🔍"?
2. **Verifique o Debug Panel** - o material aparece como selecionado?
3. **Verifique a ordem dos logs** - validação está acontecendo após seleção?

### Logs Esperados (ordem correta):
```
🧪 MaterialAutocomplete: Suggestion clicked: {material object}
🧪 MaterialAutocomplete: Calling onMaterialSelect with: {material}
🔍 DEBUG: handleMaterialSelected called: {material details}
🔍 DEBUG: handleItemFieldBlur scheduled with delay: {...}
🔍 DEBUG: Validating material after delay: {material object}
🔍 DEBUG: Validation result after delay: {error: null}
```

## 🛠️ Soluções Aplicadas

### 1. Delay na Validação
- `handleItemFieldBlur` agora tem delay de 500ms
- Garante que estado seja atualizado antes da validação

### 2. Uso de Estado Atual
- Validação usa `items[itemIndex]` em vez do valor passado
- Evita valores desatualizados

### 3. Logs Detalhados
- Rastreia cada etapa do processo
- Identifica onde ocorre o problema

## 🔄 Fluxo Esperado Corrigido

1. **Usuário seleciona material** → Estado atualizado
2. **Delay de 500ms** → Garante consistência do estado
3. **Validação executada** → Usa estado mais recente
4. **Erro removido** → Material reconhecido como válido

## 📝 Notas de Uso

- O Debug Panel pode ser minimizado clicando no "✕"
- Todos os testes devem ser executados com o console aberto
- Se o problema persistir, capture os logs e envie para análise

## 🆘 Suporte

Se após todos os testes o problema continuar:
1. Execute o teste automatizado
2. Copie todos os logs do console
3. Verifique se o Debug Panel mostra o material como selecionado
4. Documente os passos exatos para reproduzir