# Plano de Refatoração Detalhado - Backend SGO

## 1. Visão Geral da Refatoração

### 1.1 Objetivo Principal
Transformar a arquitetura monolítica atual em uma arquitetura limpa e modular, seguindo os princípios SOLID e padrões de Clean Architecture.

### 1.2 Princípios Norteadores
- **Separação de Responsabilidades**: Cada classe/módulo com uma única responsabilidade
- **Inversão de Dependência**: Dependências apontam para abstrações
- **Testabilidade**: Código facilmente testável com mocks
- **Manutenibilidade**: Código fácil de entender e modificar
- **Escalabilidade**: Arquitetura que suporte crescimento

## 2. Arquitetura Alvo

### 2.1 Estrutura de Diretórios Proposta
```
backend/
├── core/
│   ├── __init__.py
│   ├── apps.py
│   ├── admin.py
│   ├── migrations/
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── usuario.py
│   │   ├── obra.py
│   │   ├── funcionario.py
│   │   ├── equipe.py
│   │   ├── locacao.py
│   │   ├── material.py
│   │   ├── compra.py
│   │   ├── despesa.py
│   │   └── anexo.py
│   ├── serializers/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── usuario.py
│   │   ├── obra.py
│   │   ├── funcionario.py
│   │   ├── equipe.py
│   │   ├── locacao.py
│   │   ├── material.py
│   │   ├── compra.py
│   │   ├── despesa.py
│   │   └── anexo.py
│   ├── views/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── auth.py
│   │   ├── usuario.py
│   │   ├── obra.py
│   │   ├── funcionario.py
│   │   ├── equipe.py
│   │   ├── locacao.py
│   │   ├── material.py
│   │   ├── compra.py
│   │   ├── despesa.py
│   │   ├── anexo.py
│   │   └── relatorio.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── compra_service.py
│   │   ├── locacao_service.py
│   │   ├── anexo_service.py
│   │   ├── relatorio_service.py
│   │   ├── pdf_service.py
│   │   ├── calculo_service.py
│   │   └── validacao_service.py
│   ├── managers/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── compra_manager.py
│   │   ├── locacao_manager.py
│   │   ├── obra_manager.py
│   │   └── relatorio_manager.py
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── constants.py
│   │   ├── exceptions.py
│   │   ├── validators.py
│   │   ├── helpers.py
│   │   ├── file_utils.py
│   │   └── date_utils.py
│   ├── urls/
│   │   ├── __init__.py
│   │   ├── api_v1.py
│   │   ├── obra_urls.py
│   │   ├── compra_urls.py
│   │   ├── locacao_urls.py
│   │   └── relatorio_urls.py
│   ├── permissions.py
│   ├── middleware.py
│   └── tests/
│       ├── __init__.py
│       ├── test_models/
│       ├── test_services/
│       ├── test_views/
│       └── test_utils/
```

### 2.2 Camadas da Arquitetura

#### 2.2.1 Camada de Apresentação (Views)
- **Responsabilidade**: Apenas receber requests e retornar responses
- **Não deve conter**: Lógica de negócio, validações complexas, cálculos
- **Deve fazer**: Validação básica, chamadas para services, formatação de resposta

#### 2.2.2 Camada de Serviços (Services)
- **Responsabilidade**: Lógica de negócio e orquestração
- **Contém**: Regras de negócio, validações complexas, coordenação entre managers
- **Exemplos**: CompraService, LocacaoService, RelatorioService

#### 2.2.3 Camada de Gerenciadores (Managers)
- **Responsabilidade**: Operações de dados e queries complexas
- **Contém**: Queries customizadas, agregações, operações de banco
- **Exemplos**: CompraManager, ObraManager

#### 2.2.4 Camada de Modelos (Models)
- **Responsabilidade**: Representação de dados e validações básicas
- **Não deve conter**: Lógica de negócio complexa
- **Deve conter**: Validações de campo, propriedades calculadas simples

#### 2.2.5 Camada de Utilitários (Utils)
- **Responsabilidade**: Funções auxiliares reutilizáveis
- **Contém**: Validadores, helpers, constantes, exceções customizadas

## 3. Estratégia de Implementação

### 3.1 Abordagem Incremental

#### Fase 1: Preparação e Estrutura Base (Semana 1-2)
1. **Criar estrutura de diretórios**
2. **Implementar classes base** (BaseService, BaseManager, BaseView)
3. **Migrar utilitários** existentes
4. **Configurar testes** básicos

#### Fase 2: Refatoração de Modelos (Semana 3)
1. **Separar models.py** em arquivos individuais
2. **Extrair lógica de negócio** dos métodos save()
3. **Implementar managers customizados**
4. **Criar testes de modelo**

#### Fase 3: Implementação de Services (Semana 4-5)
1. **CompraService**: Lógica de compras e orçamentos
2. **LocacaoService**: Lógica de locações e cálculos
3. **AnexoService**: Gerenciamento de arquivos
4. **RelatorioService**: Geração de relatórios
5. **PDFService**: Geração de PDFs

#### Fase 4: Refatoração de Views (Semana 6-7)
1. **Separar views.py** em arquivos por domínio
2. **Simplificar views** para usar services
3. **Remover lógica de negócio** das views
4. **Implementar tratamento de erros** padronizado

#### Fase 5: Refatoração de Serializers (Semana 8)
1. **Separar serializers.py** em arquivos individuais
2. **Remover lógica de negócio** dos serializers
3. **Criar serializers específicos** para entrada e saída
4. **Otimizar queries** com select_related/prefetch_related

#### Fase 6: Testes e Validação (Semana 9-10)
1. **Implementar testes unitários** para services
2. **Implementar testes de integração** para views
3. **Validar funcionalidades** existentes
4. **Otimizar performance**

### 3.2 Estratégia de Migração Sem Downtime

#### 3.2.1 Padrão Strangler Fig
- Implementar nova funcionalidade ao lado da antiga
- Gradualmente redirecionar tráfego para nova implementação
- Remover código antigo após validação

#### 3.2.2 Feature Flags
- Usar flags para alternar entre implementações
- Permitir rollback rápido se necessário
- Testar em produção com usuários limitados

## 4. Detalhamento por Componente

### 4.1 CompraService

#### Responsabilidades:
- Criação e atualização de compras
- Processamento de itens de compra
- Aprovação de orçamentos
- Cálculos de valores e parcelas
- Coordenação com AnexoService

#### Interface:
```python
class CompraService:
    def criar_compra(self, dados_compra: dict, anexos: list) -> Compra
    def atualizar_compra(self, compra_id: int, dados: dict, anexos: list) -> Compra
    def aprovar_orcamento(self, compra_id: int) -> Compra
    def calcular_parcelas(self, compra: Compra) -> List[ParcelaCompra]
    def gerar_relatorio_pdf(self, compra_ids: List[int]) -> bytes
```

### 4.2 LocacaoService

#### Responsabilidades:
- Criação de locações simples e multi-dia
- Cálculos de pagamento
- Transferência de funcionários
- Validação de conflitos
- Relatórios de custos

#### Interface:
```python
class LocacaoService:
    def criar_locacao(self, dados_locacao: dict, anexos: list) -> List[Locacao_Obras_Equipes]
    def transferir_funcionario(self, locacao_id: int, nova_locacao: dict) -> Locacao_Obras_Equipes
    def calcular_pagamento(self, locacao: Locacao_Obras_Equipes) -> Decimal
    def validar_conflitos(self, dados_locacao: dict) -> List[str]
    def gerar_relatorio_custos(self, filtros: dict) -> dict
```

### 4.3 AnexoService

#### Responsabilidades:
- Upload e validação de arquivos
- Organização de armazenamento
- Remoção segura de arquivos
- Processamento para PDFs

#### Interface:
```python
class AnexoService:
    def upload_anexo(self, arquivo: File, tipo: str, objeto_id: int) -> Anexo
    def validar_arquivo(self, arquivo: File) -> bool
    def remover_anexo(self, anexo_id: int) -> bool
    def processar_para_pdf(self, anexos: List[Anexo]) -> List[dict]
```

## 5. Padrões e Convenções

### 5.1 Nomenclatura
- **Services**: `{Dominio}Service` (ex: CompraService)
- **Managers**: `{Dominio}Manager` (ex: CompraManager)
- **Views**: `{Dominio}ViewSet` ou `{Dominio}APIView`
- **Serializers**: `{Dominio}Serializer`, `{Dominio}CreateSerializer`

### 5.2 Tratamento de Erros
- **Exceções customizadas** para cada domínio
- **Middleware de tratamento** de erros global
- **Logs estruturados** para debugging
- **Respostas padronizadas** de erro

### 5.3 Validações
- **Validações de campo** nos serializers
- **Validações de negócio** nos services
- **Validações de integridade** nos managers

### 5.4 Testes
- **Testes unitários** para services e utils
- **Testes de integração** para views
- **Mocks** para dependências externas
- **Fixtures** para dados de teste

## 6. Cronograma Detalhado

### Semana 1: Preparação
- [ ] Criar branch `refactor/architecture`
- [ ] Implementar estrutura de diretórios
- [ ] Criar classes base (BaseService, BaseManager)
- [ ] Configurar testes básicos
- [ ] Documentar padrões de código

### Semana 2: Utilitários e Constantes
- [ ] Migrar utils.py para estrutura modular
- [ ] Criar arquivo de constantes
- [ ] Implementar exceções customizadas
- [ ] Criar validadores reutilizáveis
- [ ] Implementar helpers de data e arquivo

### Semana 3: Refatoração de Models
- [ ] Separar models.py em arquivos individuais
- [ ] Extrair lógica do método save() de Locacao_Obras_Equipes
- [ ] Implementar managers customizados
- [ ] Criar testes para models
- [ ] Validar integridade dos dados

### Semana 4: Services - Parte 1
- [ ] Implementar CompraService
- [ ] Implementar AnexoService
- [ ] Criar testes unitários para services
- [ ] Integrar services com views existentes (paralelo)

### Semana 5: Services - Parte 2
- [ ] Implementar LocacaoService
- [ ] Implementar RelatorioService
- [ ] Implementar PDFService
- [ ] Criar testes de integração

### Semana 6: Refatoração de Views - Parte 1
- [ ] Separar views.py em arquivos por domínio
- [ ] Refatorar CompraViewSet
- [ ] Refatorar LocacaoObrasEquipesViewSet
- [ ] Implementar tratamento de erros padronizado

### Semana 7: Refatoração de Views - Parte 2
- [ ] Refatorar views de relatórios
- [ ] Refatorar views de anexos
- [ ] Simplificar views para usar services
- [ ] Otimizar queries

### Semana 8: Serializers
- [ ] Separar serializers.py em arquivos individuais
- [ ] Criar serializers específicos para entrada/saída
- [ ] Remover lógica de negócio dos serializers
- [ ] Otimizar com select_related/prefetch_related

### Semana 9: Testes e Validação
- [ ] Implementar testes unitários completos
- [ ] Implementar testes de integração
- [ ] Validar todas as funcionalidades existentes
- [ ] Testes de performance

### Semana 10: Finalização
- [ ] Documentação da nova arquitetura
- [ ] Limpeza de código antigo
- [ ] Otimizações finais
- [ ] Deploy e monitoramento

## 7. Critérios de Sucesso

### 7.1 Métricas Técnicas
- **Redução de 80%** no tamanho do arquivo views.py
- **Cobertura de testes** acima de 90%
- **Complexidade ciclomática** abaixo de 10 por função
- **Tempo de resposta** mantido ou melhorado

### 7.2 Métricas de Qualidade
- **Zero regressões** em funcionalidades existentes
- **Documentação completa** da nova arquitetura
- **Padrões de código** consistentes
- **Facilidade de manutenção** demonstrada

### 7.3 Métricas de Negócio
- **Zero downtime** durante migração
- **Funcionalidades preservadas** 100%
- **Performance mantida** ou melhorada
- **Satisfação da equipe** com nova estrutura

## 8. Riscos e Mitigações

### 8.1 Riscos Técnicos

#### Quebra de Funcionalidades
- **Risco**: Alto
- **Mitigação**: Testes automatizados extensivos, implementação paralela

#### Performance Degradada
- **Risco**: Médio
- **Mitigação**: Benchmarks antes/depois, otimização de queries

#### Complexidade de Migração
- **Risco**: Alto
- **Mitigação**: Implementação incremental, rollback planejado

### 8.2 Riscos de Cronograma

#### Subestimação de Esforço
- **Risco**: Alto
- **Mitigação**: Buffer de 20% no cronograma, revisões semanais

#### Dependências Externas
- **Risco**: Médio
- **Mitigação**: Identificação prévia, planos alternativos

## 9. Plano de Rollback

### 9.1 Estratégia
- **Feature flags** para alternar implementações
- **Backup completo** antes de cada fase
- **Scripts de rollback** automatizados
- **Monitoramento** em tempo real

### 9.2 Critérios de Rollback
- **Erro crítico** em produção
- **Performance degradada** > 20%
- **Funcionalidade quebrada** não resolvida em 2h
- **Instabilidade** do sistema

## 10. Monitoramento e Métricas

### 10.1 Métricas de Performance
- Tempo de resposta das APIs
- Uso de memória e CPU
- Número de queries por request
- Taxa de erro das APIs

### 10.2 Métricas de Qualidade
- Cobertura de testes
- Complexidade ciclomática
- Duplicação de código
- Violações de padrões

### 10.3 Ferramentas
- **Testes**: pytest, coverage
- **Qualidade**: flake8, black, isort
- **Performance**: django-debug-toolbar, py-spy
- **Monitoramento**: logs estruturados, métricas customizadas

---

**Data do Plano**: Janeiro 2025  
**Versão**: 1.0  
**Status**: Aprovado para Implementação  
**Responsável**: Equipe de Desenvolvimento  