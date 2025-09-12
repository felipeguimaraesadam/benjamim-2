# Guia Completo de Correção S3 - SGO Cliente Anexos

## 🔍 DIAGNÓSTICO ATUAL

**⚠️ PROBLEMA IDENTIFICADO**: As credenciais AWS no arquivo `.env` local são de teste/exemplo e não são válidas:
- `AWS_ACCESS_KEY_ID=AKIA1ZLPIH4SAPKSAAV7P` (INVÁLIDA)
- `AWS_SECRET_ACCESS_KEY=tuWgVh56reuJ7y8qJA/ertb10TGYenhiJdQqy668` (INVÁLIDA)

### ❌ Problemas Críticos Identificados
1. **Credenciais AWS inválidas**: Access Key ID não existe nos registros da AWS
2. **CORS incompleto**: Não inclui método GET (essencial para download)
3. **Política de bucket inadequada**: Falta permissão de leitura pública
4. **Block Public Access ativo**: Impede acesso público aos arquivos
5. **Configuração Django**: Possíveis problemas com ACL e autenticação

### 📊 Status dos Anexos no Banco
- **Total de anexos**: 5
- **Anexos OK**: 1
- **Anexos com problemas**: 4 (URLs S3 inválidas)

## 🚨 AÇÃO IMEDIATA NECESSÁRIA

### 1. Obter Credenciais AWS Válidas

**Para o usuário do projeto:**
1. Acesse o console AWS (https://console.aws.amazon.com)
2. Vá para **IAM** > **Usuários**
3. Encontre o usuário que tem acesso ao bucket `sgo-cliente-anexos-36`
4. Clique em **Chaves de acesso** > **Criar chave de acesso**
5. Copie as credenciais geradas

**OU solicite ao administrador AWS:**
- Access Key ID válida
- Secret Access Key válida
- Confirme que o usuário tem permissões para o bucket `sgo-cliente-anexos-36`

### 2. Atualizar Arquivo .env Local

Substitua as credenciais de teste no arquivo `backend/.env`:

```env
# Configurações S3 - SUBSTITUA PELAS CREDENCIAIS REAIS
USE_S3=TRUE
AWS_ACCESS_KEY_ID=AKIA_SUA_CHAVE_REAL_AQUI
AWS_SECRET_ACCESS_KEY=sua_secret_key_real_aqui
AWS_STORAGE_BUCKET_NAME=sgo-cliente-anexos-36
AWS_S3_REGION_NAME=sa-east-1
```

### 3. Testar Configuração

Após atualizar as credenciais, execute:

```bash
cd backend
python diagnose_s3_config.py
```

## 🛠️ Soluções Passo a Passo

### **PASSO 1: Configurar CORS Corretamente**

1. Acesse o AWS S3 Console
2. Vá para o bucket `sgo-cliente-anexos-36`
3. Aba "Permissões" → "Cross-origin resource sharing (CORS)"
4. Substitua a configuração atual por:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "HEAD",
            "POST",
            "PUT",
            "DELETE"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag",
            "x-amz-meta-custom-header"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

### **PASSO 2: Configurar Política de Bucket**

1. Na aba "Permissões" → "Política do bucket"
2. Adicione a seguinte política JSON:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::sgo-cliente-anexos-36/*"
        }
    ]
}
```

### **PASSO 3: Desabilitar Bloqueio de Acesso Público**

1. Na aba "Permissões" → "Bloquear acesso público (configurações do bucket)"
2. Clique em "Editar"
3. **DESMARQUE** as seguintes opções:
   - ❌ Bloquear acesso público a buckets e objetos concedido por meio de novas listas de controle de acesso (ACLs)
   - ❌ Bloquear acesso público a buckets e objetos concedido por meio de qualquer lista de controle de acesso (ACL)
   - ❌ Bloquear acesso público a buckets e objetos concedido por meio de novas políticas de acesso público
   - ❌ Bloquear acesso público a buckets e objetos concedido por meio de qualquer política de acesso público
4. Salve as alterações

### **PASSO 4: Configurar Object Ownership**

1. Na aba "Permissões" → "Propriedade do objeto"
2. Clique em "Editar"
3. Selecione: **"ACLs habilitadas"**
4. Marque: **"Proprietário do bucket preferido"**
5. Salve as alterações

### **PASSO 5: Atualizar Configurações Django**

No arquivo `backend/sgo_core/settings.py`, adicione/modifique:

```python
# Configurações S3 para acesso público
if USE_S3:
    # ... configurações existentes ...
    
    # CRÍTICO: Desabilitar URLs assinadas para acesso público
    AWS_QUERYSTRING_AUTH = False
    
    # Definir ACL padrão como público
    AWS_DEFAULT_ACL = 'public-read'
    
    # Configurações de cache
    AWS_S3_OBJECT_PARAMETERS = {
        'CacheControl': 'max-age=86400',
    }
    
    # URLs customizadas (opcional)
    AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
```

### **PASSO 6: Verificar Variáveis de Ambiente no Render**

Confirme que as seguintes variáveis estão configuradas:

```
USE_S3=True
AWS_ACCESS_KEY_ID=AKIA1ZLPIH4SAPKSAAV7P
AWS_SECRET_ACCESS_KEY=tuWgVh56reuJ7y8qJA/ertb10TGYenhiJdQqy668
AWS_STORAGE_BUCKET_NAME=sgo-cliente-anexos-36
AWS_S3_REGION_NAME=sa-east-1
```

## 🧪 Testes e Validação

### **Teste 1: Acesso Direto ao Arquivo**

1. Pegue uma URL de arquivo do banco de dados
2. Teste diretamente no navegador:
   ```
   https://sgo-cliente-anexos-36.s3.sa-east-1.amazonaws.com/obra/arquivo.pdf
   ```
3. **Resultado esperado**: Download do arquivo (não erro 403)

### **Teste 2: Via Django Admin**

1. Acesse o Django Admin
2. Vá para um modelo com arquivos
3. Clique no link do arquivo
4. **Resultado esperado**: Download ou visualização do arquivo

### **Teste 3: Via API**

```bash
# Teste com curl
curl -I "https://sgo-cliente-anexos-36.s3.sa-east-1.amazonaws.com/obra/arquivo.pdf"

# Resultado esperado: HTTP/1.1 200 OK
```

### **Teste 4: Upload e Acesso**

1. Faça upload de um novo arquivo via aplicação
2. Verifique se o arquivo foi criado com ACL público:
   ```bash
   aws s3api get-object-acl --bucket sgo-cliente-anexos-36 --key obra/arquivo.pdf
   ```

## 🔧 Comandos de Debug

### **Verificar Configurações do Bucket**

```bash
# Verificar CORS
aws s3api get-bucket-cors --bucket sgo-cliente-anexos-36

# Verificar política do bucket
aws s3api get-bucket-policy --bucket sgo-cliente-anexos-36

# Verificar bloqueio de acesso público
aws s3api get-public-access-block --bucket sgo-cliente-anexos-36

# Verificar propriedade do objeto
aws s3api get-bucket-ownership-controls --bucket sgo-cliente-anexos-36
```

### **Verificar ACL de Arquivo Específico**

```bash
aws s3api get-object-acl --bucket sgo-cliente-anexos-36 --key "caminho/do/arquivo.pdf"
```

### **Testar Conectividade Django**

```python
# No Django shell
from django.core.files.storage import default_storage
from core.services.s3_service import S3Service

# Testar conexão
s3_service = S3Service()
print(s3_service.get_storage_info())

# Testar upload
with open('test.txt', 'w') as f:
    f.write('teste')

with open('test.txt', 'rb') as f:
    path = default_storage.save('test/test.txt', f)
    url = default_storage.url(path)
    print(f"URL gerada: {url}")
```

## 🚨 Troubleshooting Comum

### **Problema: Ainda recebo 403 após configurar**

**Possíveis causas:**
1. **Propagação de políticas**: Aguarde 5-10 minutos
2. **Cache do navegador**: Teste em aba anônima
3. **URLs antigas**: Verifique se não há cache de URLs assinadas

**Solução:**
```bash
# Limpar cache do Django
python manage.py shell
>>> from django.core.cache import cache
>>> cache.clear()
```

### **Problema: Alguns arquivos funcionam, outros não**

**Causa**: ACLs inconsistentes nos arquivos

**Solução:**
```bash
# Aplicar ACL público a todos os arquivos
aws s3 cp s3://sgo-cliente-anexos-36/ s3://sgo-cliente-anexos-36/ \
  --recursive --acl public-read --metadata-directive REPLACE
```

### **Problema: Upload funciona mas download não**

**Causa**: `AWS_QUERYSTRING_AUTH=True` (URLs assinadas)

**Solução**: Definir `AWS_QUERYSTRING_AUTH=False` no settings.py

### **Problema: Credenciais inválidas**

**Verificação:**
```bash
# Testar credenciais AWS
aws sts get-caller-identity

# Resultado esperado: informações da conta AWS
```

## 📋 Checklist Final

### Pré-requisitos (OBRIGATÓRIO)
- [ ] **Credenciais AWS válidas obtidas**
- [ ] **Arquivo .env local atualizado com credenciais reais**
- [ ] **Diagnóstico S3 executado com sucesso**

### Configurações AWS
- [ ] CORS configurado com métodos GET e HEAD
- [ ] Política de bucket permite acesso público de leitura
- [ ] Bloqueio de acesso público desabilitado
- [ ] Object Ownership permite ACLs

### Configurações Django
- [ ] `AWS_QUERYSTRING_AUTH=False` no Django
- [ ] `AWS_DEFAULT_ACL='public-read'` no Django
- [ ] Variáveis de ambiente corretas no Render

### Testes e Validação
- [ ] Teste de acesso direto funcionando
- [ ] Teste via aplicação funcionando

## 🎯 Próximos Passos

1. **Implementar as configurações na ordem apresentada**
2. **Testar cada passo antes de prosseguir**
3. **Documentar URLs que ainda falham para análise específica**
4. **Considerar migração de arquivos antigos se necessário**

---

## 📊 RESUMO EXECUTIVO

### 🎯 Problema Principal
O acesso aos arquivos S3 falha com erro 403 Forbidden porque:
1. **Credenciais AWS locais são inválidas** (problema imediato)
2. **Configurações S3 podem estar inadequadas** (problema secundário)

### 🚀 Solução Prioritária
1. **PRIMEIRO**: Obter credenciais AWS válidas
2. **SEGUNDO**: Atualizar arquivo .env local
3. **TERCEIRO**: Executar diagnóstico para identificar problemas reais
4. **QUARTO**: Aplicar correções específicas baseadas no diagnóstico

### ⏱️ Tempo Estimado
- **Obtenção de credenciais**: 5-10 minutos
- **Configuração local**: 2 minutos
- **Diagnóstico**: 1 minuto
- **Correções S3**: 15-30 minutos
- **Testes**: 10 minutos

**⚠️ IMPORTANTE**: Após implementar todas as configurações, aguarde 5-10 minutos para propagação completa das políticas AWS antes de testar.

**🔒 SEGURANÇA**: As configurações acima permitem acesso público de leitura. Certifique-se de que isso está alinhado com os requisitos de segurança do projeto.