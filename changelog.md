# Changelog

## [v0.6.4] - YYYY-MM-DD
### Corrigido
- **Listagem de Compras:** Ajustada a exibição de compras para suportar múltiplos itens. Implementado um modal para detalhar os itens de cada compra, melhorando a clareza e usabilidade da página de compras. O backend serializer (`ItemCompraSerializer`) foi ajustado para prover o campo `material_nome`, facilitando a exibição dos nomes dos materiais no frontend.

## [0.6.3] - 2024-08-02
### Fixed
- **Frontend Build/Runtime Errors**:
    - Resolvido erro de importação `Failed to resolve import "react-toastify"` (e o CSS relacionado `react-toastify/dist/ReactToastify.css`) em `frontend/src/main.jsx` adicionando `react-toastify` às dependências em `frontend/package.json`. Isso garante que a biblioteca de notificações toast seja corretamente instalada e empacotada. (Requer `npm install` ou `yarn install` no diretório `frontend` para aplicar a correção em ambientes locais).
    - Corrigido erro de sintaxe JSX ("Unexpected token, expected ','") em `frontend/src/pages/MateriaisPage.jsx` pela remoção de um bloco de props de paginação que estava duplicado e mal posicionado dentro de uma condicional de renderização do modal de formulário.
- **Backend Database Migration**:
    - Criada nova migração (`0016_material_add_stock_fields.py`) para a aplicação `core` para adicionar os campos `quantidade_em_estoque` e `nivel_minimo_estoque` ao modelo `Material`. Esta migração é necessária para refletir as alterações do modelo no esquema do banco de dados e previne potenciais erros de `OperationalError` (no such column) ou avisos de `makemigrations` sobre alterações não migradas.

## [0.6.2] - 2024-08-02
### Fixed
- **Correção no Script de Migração (`run_migrations.bat`)**:
    - Modificado o script `run_migrations.bat` para garantir a instalação das dependências listadas em `backend/requirements.txt` (incluindo `Pillow`, essencial para `ImageField`) após a ativação do ambiente virtual e antes da execução das migrações do Django.
    - Esta correção visa prevenir erros como `SystemCheckError` relacionados à ausência de `Pillow` ao executar o script em um ambiente limpo ou onde as dependências não estão completamente instaladas.
    - Adicionada verificação de erro após cada etapa crítica no script (ativação do venv, instalação de dependências, execução de migrações) para fornecer feedback mais claro e interromper a execução em caso de falha.

## [0.6.1] - 2024-08-02
### Added
- **Melhorias no Feedback Visual (UI/UX) em Módulos Chave**:
    - Implementado sistema de notificações toast (`react-toastify`) para fornecer feedback claro de sucesso e erro em operações de Criação, Leitura (apenas erros), Atualização e Exclusão (CRUD) nos principais módulos, incluindo Materiais, Locações, Funcionários, Obras, Equipes, Compras, Despesas Extras e Ocorrências.
    - Adicionados spinners de carregamento (`SpinnerIcon.jsx`) em botões de ação (ex: Salvar, Excluir, Gerar Relatório) durante o processamento de requisições assíncronas, melhorando a percepção do usuário sobre o estado da aplicação.
    - Introduzidos spinners de carregamento em nível de página para indicar o carregamento inicial de listas de dados.
    - Criado o utilitário `frontend/src/utils/toastUtils.js` para padronizar e simplificar a exibição de notificações toast.
    - Criado o componente `frontend/src/components/utils/SpinnerIcon.jsx` para ícones de carregamento consistentes em botões.
### Changed
- **Status de Implementação**: Todas as tarefas principais e pendentes listadas no `implementar.md` (conforme revisão de 2024-08-02) foram concluídas ou marcadas como tal. Isso inclui a reformulação geral do módulo de Locação (cujas sub-tarefas específicas foram finalizadas anteriormente) e as melhorias de UI/UX como Paginação e Feedback Visual (Toasts/Spinners) aplicadas globalmente. O backlog em `implementar.md` agora reflete apenas futuras melhorias não escopadas para esta fase.

## [0.6.0] - 2024-08-02
### Added
- **Paginação Implementada em Tabelas Principais**:
    - Adicionado sistema de paginação (10 itens por página por padrão) nas listagens das seguintes áreas para melhorar a performance e usabilidade com grandes volumes de dados:
        - Locações (`LocacoesPage.jsx`)
        - Materiais (`MateriaisPage.jsx`)
        - Funcionários (`FuncionariosPage.jsx`)
        - Obras (`ObrasPage.jsx`)
        - Equipes (`EquipesPage.jsx`)
        - Compras (`ComprasPage.jsx`)
        - Despesas Extras (`DespesasExtrasPage.jsx`)
        - Ocorrências (`OcorrenciasPage.jsx`)
    - Inclui controles de navegação "Anterior"/"Próxima", exibição de "Página X de Y" e "Total de itens".
    - Backend APIs atualizadas para suportar paginação (configuração global no DRF e adaptação das funções de serviço no frontend API).
    - Criado componente reutilizável `PaginationControls.jsx` para uma interface de paginação consistente.

## [0.5.1] - 2024-08-02
### Added
- **Alerta de Estoque Baixo para Materiais**:
    - Adicionado campo `nivel_minimo_estoque` e `quantidade_em_estoque` ao modelo `Material` no backend. (Nota: `quantidade_em_estoque` adicionada para funcionalidade do alerta, sua gestão completa de entradas/saídas de estoque é uma tarefa futura).
    - Formulário de material (criação/edição) atualizado para incluir campos para definir o "Nível Mínimo de Estoque para Alerta" e a "Quantidade em Estoque" inicial.
    - Implementado novo endpoint na API (`/api/materiais/alertas-estoque-baixo/`) que retorna materiais cujo `quantidade_em_estoque` é menor ou igual ao `nivel_minimo_estoque` (e `nivel_minimo_estoque > 0`).
    - Na página de listagem de materiais no frontend:
        - Exibição de um banner de alerta no topo da página quando existem materiais com estoque baixo, listando os nomes, quantidade atual e nível mínimo definido.
        - Adicionadas novas colunas na tabela de materiais: "Estoque Atual" e "Nível Mínimo", exibindo os respectivos valores.
        - Destaque visual (fundo amarelo) para as linhas na tabela que correspondem a materiais com estoque baixo.
        - Destaque visual adicional (texto em vermelho e negrito) para o valor do "Estoque Atual" na tabela quando este estiver abaixo ou igual ao nível mínimo.
### Changed
- O script `run_migrations.bat` foi verificado e já inclui o comando `python backend/manage.py migrate`, que aplicará as novas migrações do modelo `Material` necessárias para esta funcionalidade.

## [0.5.0] - 2024-08-02
### Added
- **(RELATÓRIO) Folha de Pagamento Semanal**:
    - Adicionado botão "Gerar Relatório de Pagamento" na página de Locações, abrindo um modal de múltiplos passos para configuração e visualização do relatório.
    - Permite seleção de período (data de início e fim) para o qual o relatório será gerado.
    - **Pré-verificação de Dias**: Antes de gerar o relatório final, o sistema realiza uma verificação e alerta o usuário sobre quaisquer dias dentro do período selecionado que não possuem locações ativas registradas. O usuário pode optar por continuar a geração do relatório ou cancelar para ajustar o período.
    - **Consolidação de Pagamentos por Funcionário**: O relatório gerado consolida todas as locações ativas do período selecionado, agrupadas e totalizadas por funcionário.
    - **Respeito à Data de Pagamento Programada**: Locações cuja `data_pagamento` está explicitamente definida para uma data futura (posterior à data de fim do período do relatório) não são incluídas na totalização do período corrente, garantindo que apenas pagamentos devidos sejam listados.
    - **Exibição Detalhada**: Para cada funcionário listado, o relatório exibe as locações individuais (incluindo nome da obra, data de início da locação, tipo de pagamento e valor do pagamento) e o valor total a ser pago ao funcionário referente ao período selecionado.

## [0.4.0] - 2024-08-02
### Added
- **Análise de Custo de Locação**: Adicionado um gráfico de barras **verticais** na página de Locações que exibe o custo total de locações por dia nos últimos 30 dias. O gráfico inclui:
    - Filtro por obra.
    - Orientação vertical: Datas no eixo X (inferior, formato DD/MM) e Custos no eixo Y (lateral, formato R$).
    - Indicação visual clara (barra amarela na base do gráfico, diferenciada na cor) para dias sem locações ou com custo zero.
    - Tooltip informativo para todas as barras, detalhando custo/status e data completa.
    - Legenda explicativa para as cores das barras.

## [EM_DESENVOLVIMENTO] - 2024-07-30

### ✨ Adicionado (em 2024-08-01)
- **Galeria de Fotos da Obra**:
  - Usuários agora podem fazer upload de imagens (PNG, JPG/JPEG) para obras específicas na página de detalhes da obra.
  - As imagens são exibidas em uma galeria com visualização em miniatura e modal para imagem ampliada.
  - Inclui campo de descrição opcional para cada foto.
  - A galeria é atualizada automaticamente após o upload de uma nova foto.

### 🐛 Corrigido (em 2024-08-01)
- Adicionada a dependência `Pillow` ao `backend/requirements.txt`. Esta biblioteca é necessária para a funcionalidade de upload de imagens da galeria de fotos e não estava sendo instalada automaticamente, causando erro nas migrações em ambientes limpos.
- Corrigidos os caminhos de importação para os componentes `ObraFotosUpload` and `ObraGaleria` na página `ObraDetailPage.jsx`, resolvendo um erro de build no frontend.
- Corrigida a importação do módulo da API nos componentes `ObraFotosUpload.jsx` e `ObraGaleria.jsx`. Estavam tentando importar uma exportação padrão inexistente, agora usam a exportação nomeada `apiClient` corretamente.
- Corrigido o envio de dados no formulário de criação/edição de usuários (`UsuarioForm.jsx`). O campo de senha agora é enviado como `password` para o backend, resolvendo o erro 400 (Bad Request).
- Corrigido um `TypeError` no backend (`FotoObraViewSet`) que ocorria durante o upload de fotos devido à tentativa de copiar objetos de arquivo. A manipulação de dados de formulário e arquivos foi refatorada.
- Configurado o servidor de desenvolvimento Django para servir arquivos de mídia (`MEDIA_URL` e `MEDIA_ROOT`), permitindo a visualização de imagens carregadas.

### Added
- **Sistema de Permissões por Nível de Acesso**:
  - Implementado um sistema de permissões baseado no campo `nivel_acesso` do `Usuario`.
  - **Admin**: Usuários com `nivel_acesso='admin'` têm acesso total (CRUD completo) a todas as funcionalidades e endpoints da API.
  - **Gerente**: Usuários com `nivel_acesso='gerente'` podem visualizar e adicionar dados na maioria das seções (Obras, Funcionários, Locações, Materiais, Compras, Despesas, Ocorrências, etc.), mas não podem modificar ou excluir registros existentes. O acesso a relatórios e ao dashboard é permitido (somente leitura).
  - Outros níveis de acesso (e usuários não autenticados) têm acesso restrito conforme as permissões aplicadas.
  - Testes automatizados foram adicionados para verificar as regras de permissão para os diferentes níveis de acesso.
- **Filtros na Lista de Compras e Relatório Geral de Compras**:
  - Adicionados filtros por intervalo de datas (`data_inicio`, `data_fim`) e por nome do fornecedor (`fornecedor__icontains`) na API e interface da lista de compras.
  - Backend: `CompraViewSet` e `RelatorioGeralComprasView` atualizados para suportar os novos parâmetros de consulta.
  - Frontend: Página de Compras (`ComprasPage.jsx`) atualizada com campos de entrada para data de início, data de fim e nome do fornecedor, além de botões para aplicar e limpar os filtros.
  - Testes de backend foram adicionados para validar a lógica de filtragem.
- **Modal de Detalhes da Locação**:
  - Adicionado um ícone de "visualizar detalhes" (olho) em cada linha da tabela de locações.
  - Ao clicar no ícone, um modal é exibido com informações completas da locação selecionada, como obra, recurso locado (funcionário, equipe ou serviço externo), datas, tipo de pagamento, valor, status e observações.
  - Frontend: Criado o componente `LocacaoDetailModal.jsx` e integrado à página `LocacoesPage.jsx` para gerenciamento de estado e exibição.
- **Campo de Observações no Formulário de Locação**:
  - Adicionado campo `observacoes` (TextField) ao modelo `Locacao_Obras_Equipes` no backend.
  - Criada migração de banco de dados (`0014_locacao_obras_equipes_observacoes.py`) para aplicar a alteração no esquema.
  - Frontend: Formulário de criação/edição de locação (`LocacaoForm.jsx`) atualizado para incluir um campo `textarea` para o preenchimento das observações.

## [Próxima Versão] - 2025-06-15

### Adicionado
- Adicionados campos para valores padrão de diária, metro e empreitada no cadastro de funcionários. Implementado autopreenchimento destes valores no formulário de locação. Adicionada funcionalidade para, mediante confirmação do usuário, atualizar o valor padrão do funcionário se este for alterado durante a criação de uma locação.

### Modificado
- A `data_locacao_fim` em Locações agora é definida automaticamente como a `data_locacao_inicio` se não for especificada ou se for anterior à data de início. Locações existentes com data de fim nula foram atualizadas para seguir esta regra. O campo `data_locacao_fim` não permite mais valores nulos no banco de dados.

## [Unreleased] - 2025-06-14

### Melhorias
- Melhorado o script `config.bat` para tratar de forma mais informativa o resultado do `npm install`. Agora, exibe um aviso caso `npm install` termine com erro (ex: devido a vulnerabilidades detectadas), mas permite que o script de configuração do frontend prossiga, evitando o término abrupto.

### Added
- **Definição de Pagamento na Locação**: Ao locar um funcionário, equipe ou serviço externo, agora é obrigatório definir o tipo de pagamento (diária, por metro, empreitada), o valor do pagamento. Opcionalmente, uma data futura para o pagamento pode ser especificada. Isso se aplica tanto ao backend (modelo e API) quanto ao frontend (formulário e tabela de locações).
- O campo 'Data Pagamento' no formulário de nova locação agora é preenchido automaticamente com a data atual.
- Validação de Duplicidade de Locação: Implementada validação no backend para impedir que um funcionário seja locado em períodos conflitantes. O frontend agora exibe um alerta detalhado informando a obra e o período do conflito.
- Implementada funcionalidade de Transferência de Funcionário: Ao tentar locar um funcionário que já possui uma locação conflitante, o sistema agora oferece a opção de transferi-lo. Se confirmado, a locação anterior é finalizada (com ajuste de custo, zerando o valor da locação anterior na obra de origem) e a nova locação é criada na obra de destino.
- **Status e Ordenação de Locações**:
    - Adicionado campo `status_locacao` ('ativa', 'cancelada') ao modelo de Locação.
    - Locações transferidas são agora marcadas como 'cancelada'.
    - A lista de locações agora é ordenada por status dinâmico (Hoje, Futura, Passada) e depois por 'Cancelada', com ordenação secundária por data de início.
    - Interface exibe o status da locação com cores distintivas (Azul: Futura, Verde: Hoje, Amarelo: Passada, Vermelho: Cancelada) nas tabelas e listas de locação.

### Fixed
- Corrigido nome da obra na listagem de obras (exibia ID em vez do nome).
- Corrigida a exibição de detalhes da locação na página de detalhes da obra para mostrar corretamente o recurso alocado (equipe, funcionário, serviço externo) e os valores de pagamento.
- Ajustado cálculo de custo total e custos por categoria na Obra para incluir os custos de locações.
- Garantido que o painel financeiro na página de detalhes da obra seja atualizado após a remoção de uma locação.
- **Consistência de Datas (Fuso Horário)**: Corrigido um problema onde datas de locação eram exibidas com um dia de diferença entre diferentes telas (e.g., detalhes da obra vs. lista de locações). Ajustadas as configurações de fuso horário do Django para 'America/Sao_Paulo' e padronizada a formatação de datas no frontend para evitar conversões indesejadas baseadas no fuso horário do navegador.

## [Unreleased] - 2025-06-10

### Added
- (Full Stack) Implementada a funcionalidade de "Locação Individual".
  - Backend: Adicionado campo `funcionario_locado` ao modelo `Locacao_Obras_Equipes`. Serializer atualizado para incluir `funcionario_locado_nome` e validar a exclusividade mútua entre `equipe`, `funcionario_locado` e `servico_externo`. Migração `0008_add_funcionario_locado_to_locacao.py` criada.
  - Frontend: Formulário `LocacaoForm.jsx` atualizado para permitir a seleção do tipo de locação (Equipe, Funcionário, Serviço Externo) e os campos de entrada correspondentes. Tabela `LocacoesTable.jsx` atualizada para exibir o tipo de recurso locado.
  - **Nota Importante:** As migrações de banco de dados (`0007` e `0008`) não puderam ser aplicadas devido a limitações do ambiente. O usuário deve executar 'python manage.py migrate' manualmente.
- Adicionado script `run_migrations.bat` na raiz do projeto para facilitar a execution do comando `python manage.py migrate` do Django.
- Implementada a funcionalidade de visualização de Detalhes da Obra (`/obras/:id`), exibindo informações principais da obra e seções para dados relacionados (compras, despesas, equipes).
- Nova seção "Acesso Rápido" no Dashboard (`/`) com atalhos para Obras, Funcionários e Relatórios.
- Múltiplos novos links de navegação no menu lateral (`Navegacao.jsx`) para todas as seções principais do sistema (Dashboard, Obras, Funcionários, Equipes, Materiais, Compras, Despesas, Alocações, Ocorrências, Relatórios).
- Added/Updated `planejamento.md` with full project details.
- Included debug-mode versions of `config.bat` and `start.bat` for testing.
- Initial project structure setup: `backend` and `frontend` directories.
- Created `README.md` with basic project information and setup instructions.
- Created this `changelog.md`.
- Initialized Django backend project (`sgo_core`) with a `core` app, defined basic models (`Usuario`, `Obra`), configured settings, and applied initial migrations.
- Initialized React frontend project using Vite, set up Tailwind CSS, and configured basic structure.
- Verified backend (`requirements.txt`) and frontend (`package.json`) dependency files.
- `config.bat`: Script for one-time Windows environment setup (dependencies, Python venv, migrations, npm install).
- `start.bat`: Script for starting Django and Vite/React development servers on Windows.

### Changed
- (Full Stack) Renomeada a terminologia de "Alocação" para "Locação".
  - Frontend: Atualizados nomes de arquivos, componentes, variáveis, funções, texto da UI e nomes de funções de serviço API.
  - Backend: Atualizados nomes de modelos (Alocacao_Obras_Equipes -> Locacao_Obras_Equipes), campos de modelo (data_alocacao_* -> data_locacao_*), serializers, views e URLs (API de /api/alocacoes/ para /api/locacoes/).
  - **Nota Importante:** Uma migração de banco de dados (`0007_rename_locacao_model_and_fields.py`) foi criada, mas não pôde ser aplicada devido a limitações do ambiente. O usuário deve executar 'python manage.py migrate' manualmente para que as alterações do backend funcionem.
- Navegação principal (`Navegacao.jsx`) reorganizada com agrupamentos lógicos ("Cadastros", "Financeiro", "Operacional") e ícones para melhor usabilidade.
- Botão "Visualizar" na tabela de obras agora direciona para a nova página de Detalhes da Obra.
- `planejamento.md` atualizado para refletir o progresso atual das funcionalidades e adicionar uma seção de "Próximos Passos".
- Replaced previous general startup scripts with a Windows-specific two-script system (`config.bat` for setup, `start.bat` for execution).
- `README.md` updated to focus entirely on the new Windows-specific `config.bat` and `start.bat` workflow.

### Fixed
- Corrigido `ImportError` em `backend/core/admin.py` que impedia a execução de `manage.py migrate`. A importação do modelo `Alocacao_Obras_Equipes` foi atualizada para `Locacao_Obras_Equipes` e o registro no admin site também foi corrigido.
- Corrigido o formulário de edição de obra que não carregava os dados existentes ao ser aberto para um registro existente.

### Removed
- Link "Documentos" removido da navegação principal (`Navegacao.jsx`), pois a funcionalidade não será implementada.
- Deleted `start.sh` (previous Linux/macOS specific startup script).
- Deleted the first version of `start.bat` (which was a general setup and execution script for Windows).

---
Formato do Changelog baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).
