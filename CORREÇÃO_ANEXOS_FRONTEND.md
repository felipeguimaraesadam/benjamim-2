# Correção dos Erros de Anexos - Frontend

## 📋 Resumo dos Problemas Identificados

### 1. ❌ Erro 500 em `/arquivos-obra/?obra=271`
**Causa:** A obra com ID 271 não existe no banco de dados.
**Status:** ✅ Identificado - não é um erro de código, mas sim dados inexistentes.

### 2. ❌ Erro 404 em `/anexos-s3/3/download/`
**Causa:** Incompatibilidade entre frontend e backend na identificação de anexos.
**Status:** ✅ Identificado e solução documentada.

## 🔧 Correção Necessária no Frontend

### Problema Atual
O frontend está construindo URLs de download usando o **ID numérico**:
```javascript
// ❌ INCORRETO
const downloadUrl = `/anexos-s3/${anexo.id}/download/`;
// Exemplo: /anexos-s3/3/download/
```

### Solução Correta
O backend espera o **anexo_id (UUID)** conforme configurado no `AnexoS3ViewSet`:
```python
# Backend configuration
class AnexoS3ViewSet(viewsets.ModelViewSet):
    lookup_field = 'anexo_id'  # ← Usa UUID, não ID numérico
```

O frontend deve usar:
```javascript
// ✅ CORRETO
const downloadUrl = `/anexos-s3/${anexo.anexo_id}/download/`;
// Exemplo: /anexos-s3/d71cdbbe-93c4-4df5-b58a-f15ccd9bea1c/download/
```

## 📊 Estrutura dos Dados

### Anexo S3 Object Structure
```json
{
  "id": 3,                                           // ← ID numérico (não usar para URLs)
  "anexo_id": "d71cdbbe-93c4-4df5-b58a-f15ccd9bea1c", // ← UUID (usar para URLs)
  "nome_original": "test_upload2.txt",
  "s3_key": "test/2025/09/11/9b4798a0_test_upload2.txt",
  "content_type": "text/plain",
  "uploaded_at": "2025-01-12T08:39:51.283749Z"
}
```

## 🛠️ Implementação da Correção

### 1. Listar Anexos
Ao receber a lista de anexos, certifique-se de que o campo `anexo_id` está disponível:
```javascript
// Verificar se a API retorna anexo_id
const anexos = await api.get('/anexos-s3/');
console.log('Anexo structure:', anexos.data.results[0]);
```

### 2. Download de Anexos
Atualizar a função de download:
```javascript
// ❌ Antes (incorreto)
const handleDownload = (anexo) => {
  const url = `/anexos-s3/${anexo.id}/download/`;
  window.open(url);
};

// ✅ Depois (correto)
const handleDownload = (anexo) => {
  const url = `/anexos-s3/${anexo.anexo_id}/download/`;
  window.open(url);
};
```

### 3. Outras Operações
Todas as operações que referenciam anexos específicos devem usar `anexo_id`:
```javascript
// Preview
const previewUrl = `/anexos-s3/${anexo.anexo_id}/preview/`;

// Delete
const deleteAnexo = (anexo) => {
  return api.delete(`/anexos-s3/${anexo.anexo_id}/`);
};
```

## 🧪 Teste da Correção

### URLs de Teste
```bash
# ❌ Falha (404) - usando ID numérico
https://django-backend-e7od-4cjk.onrender.com/api/anexos-s3/3/download/

# ✅ Sucesso (200) - usando anexo_id UUID
https://django-backend-e7od-4cjk.onrender.com/api/anexos-s3/d71cdbbe-93c4-4df5-b58a-f15ccd9bea1c/download/
```

### Verificação
1. Listar anexos: `GET /anexos-s3/`
2. Identificar o `anexo_id` do anexo desejado
3. Usar o `anexo_id` para download: `GET /anexos-s3/{anexo_id}/download/`

## 📝 Checklist de Implementação

- [ ] Atualizar função de download para usar `anexo_id`
- [ ] Atualizar função de preview para usar `anexo_id`
- [ ] Atualizar função de delete para usar `anexo_id`
- [ ] Verificar se a API de listagem retorna `anexo_id`
- [ ] Testar download com anexos existentes
- [ ] Verificar se não há outras referências ao ID numérico

## 🚀 Próximos Passos

1. **Implementar as correções no frontend**
2. **Testar localmente**
3. **Deploy das correções**
4. **Verificar funcionamento em produção**

---

**Nota:** O backend já está configurado corretamente. A correção é necessária apenas no frontend para usar o campo correto (`anexo_id` ao invés de `id`).