# Sistema de Testes e Monitoramento - SGO

Este documento descreve o sistema completo de testes e monitoramento implementado para o SGO (Sistema de Gestão de Obras).

## 📋 Funcionalidades Implementadas

### 1. Sistema de Logging Backend (Django)
- ✅ Endpoint `/api/frontend-error-log/` para receber logs do frontend
- ✅ Suporte a diferentes tipos de erro (JavaScript, Network, User Action)
- ✅ Validação robusta de dados
- ✅ Logging estruturado com timestamps
- ✅ Suporte a métodos HTTP GET e POST

### 2. Testes Automatizados
- ✅ Testes de disponibilidade de servidores
- ✅ Testes de funcionalidade do endpoint de logging
- ✅ Testes de validação de dados
- ✅ Testes de métodos HTTP
- ✅ Testes de performance e stress
- ✅ Testes de integração frontend-backend

### 3. Relatórios e Monitoramento
- ✅ Relatórios JSON detalhados
- ✅ Métricas de performance
- ✅ Taxa de sucesso dos testes
- ✅ Logs estruturados para debugging

## 🚀 Como Usar

### Execução Rápida
```bash
# Executa todos os testes
python run_tests.py

# Executa apenas testes básicos (mais rápido)
python run_tests.py --quick

# Executa testes de stress
python run_tests.py --stress

# Gera apenas relatório dos últimos testes
python run_tests.py --report-only
```

### Execução Manual dos Testes

#### 1. Testes de Monitoramento
```bash
python test_monitoring_system.py
```

#### 2. Testes de Integração Completos
```bash
python test_integration_complete.py
```

### Pré-requisitos

1. **Servidores em execução:**
   ```bash
   # Terminal 1 - Backend Django
   cd backend
   python manage.py runserver
   
   # Terminal 2 - Frontend React
   cd frontend
   npm run dev
   ```

2. **Dependências Python:**
   ```bash
   pip install requests
   ```

## 📊 Tipos de Teste

### Testes de Disponibilidade
- Verifica se backend (Django) está respondendo
- Verifica se frontend (React) está acessível
- Testa conectividade básica

### Testes de Funcionalidade
- **JavaScript Errors**: Testa logging de erros JS
- **Network Errors**: Testa logging de erros de rede
- **User Action Errors**: Testa logging de ações do usuário

### Testes de Validação
- Dados vazios
- JSON malformado
- Mensagens muito grandes
- Caracteres especiais e Unicode

### Testes de Métodos HTTP
- GET: Deve retornar status do endpoint
- POST: Deve aceitar logs de erro
- PUT/DELETE/PATCH: Devem ser rejeitados (405)

### Testes de Performance
- Stress test com 100 requisições simultâneas
- Medição de tempo de resposta
- Taxa de sucesso sob carga

## 📈 Interpretação dos Resultados

### Status dos Testes
- **PASS**: ✅ Teste passou
- **FAIL**: ❌ Teste falhou

### Taxa de Sucesso
- **100%**: 🎉 Sistema perfeito
- **90-99%**: ⚠️ Sistema funcional com problemas menores
- **<90%**: 🚨 Sistema com problemas significativos

### Arquivos de Relatório
- `monitoring_test_report_YYYYMMDD_HHMMSS.json`: Relatório de testes de monitoramento
- `integration_test_report_YYYYMMDD_HHMMSS.json`: Relatório de testes de integração
- `test_summary_YYYYMMDD_HHMMSS.json`: Resumo geral de todos os testes

## 🔧 Integração com CI/CD

### GitHub Actions (exemplo)
```yaml
name: SGO Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.8'
      - name: Install dependencies
        run: pip install requests
      - name: Start servers
        run: |
          python backend/manage.py runserver &
          cd frontend && npm install && npm run dev &
          sleep 10
      - name: Run tests
        run: python run_tests.py
```

### Jenkins (exemplo)
```groovy
pipeline {
    agent any
    stages {
        stage('Test') {
            steps {
                sh 'pip install requests'
                sh 'python run_tests.py'
            }
        }
    }
    post {
        always {
            archiveArtifacts artifacts: '*_report_*.json', fingerprint: true
        }
    }
}
```

## 🚨 Alertas e Monitoramento

### Configuração de Alertas
1. **Email**: Configure para enviar emails quando taxa de sucesso < 90%
2. **Slack**: Integre com Slack para notificações em tempo real
3. **Dashboard**: Use os JSONs para criar dashboards de monitoramento

### Métricas Importantes
- Taxa de sucesso dos testes
- Tempo de resposta do endpoint
- Frequência de erros por tipo
- Performance sob carga

## 🛠️ Troubleshooting

### Problemas Comuns

#### Erro: "Backend não respondeu adequadamente (status: 500)"
- Verifique se o Django está rodando: `python manage.py runserver`
- Verifique logs do Django para erros
- Confirme que não há problemas de migração

#### Erro: "Frontend não respondeu adequadamente"
- Verifique se o React está rodando: `npm run dev`
- Confirme que a porta 5173 está livre
- Verifique se as dependências estão instaladas

#### Erro: "ModuleNotFoundError: No module named 'requests'"
- Instale a dependência: `pip install requests`

#### Taxa de sucesso baixa em stress tests
- Pode indicar problemas de performance
- Verifique recursos do servidor (CPU, memória)
- Considere otimizações no código

### Logs de Debug
- Logs detalhados são salvos em `integration_test.log`
- Use para debugging de problemas específicos
- Contém timestamps e stack traces completos

## 📝 Próximos Passos

1. **Automação**: Integre no pipeline de CI/CD
2. **Monitoramento**: Configure alertas automáticos
3. **Expansão**: Adicione mais tipos de teste conforme necessário
4. **Dashboard**: Crie visualizações dos dados de teste
5. **Documentação**: Mantenha este README atualizado

## 🤝 Contribuição

Para adicionar novos testes:
1. Edite `test_integration_complete.py`
2. Adicione novos métodos de teste
3. Atualize a documentação
4. Execute os testes para verificar

## 📞 Suporte

Em caso de problemas:
1. Verifique este README
2. Analise os logs de erro
3. Execute testes individuais para isolar problemas
4. Consulte a documentação do Django/React conforme necessário