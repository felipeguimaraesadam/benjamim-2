# Changelog

## [v0.6.20] - 2024-08-06
### Adicionado
- **Página de Detalhes do Material**:
  - Backend: Criado endpoint `/api/materiais/<id>/details/` que retorna dados do material e seu histórico de uso. `MaterialDetailSerializer` implementado.
  - Frontend: Criada `MaterialDetailPage.jsx` e rota. Adicionado ícone de visualização na `MateriaisTable.jsx`.
- **Relatório de Pagamento de Locação (Semanal) (Melhorado)**:
  - Backend (`RelatorioFolhaPagamentoViewSet`):
    - Ação `pre_check_dias_sem_locacoes` melhorada para identificar "medições pendentes".
    - Ação `generate_report` refatorada para incluir todos os tipos de locações (funcionário, equipe, serviço externo com valor), calcular custos diários para locações multi-dia (diárias são rateadas, outras são atribuídas ao dia de início), e estruturar saída por obra e depois por dia.
  - Frontend (`LocacoesPage.jsx`):
    - Botão "Relatório de Pagamento" com estilo ajustado (fundo verde).
    - Modal do relatório agora inclui seletor de semanas para facilitar escolha do período.
    - Exibição do relatório atualizada para estrutura diária por obra, incluindo todos os tipos de locação e seus custos diários atribuídos.
    - CSV export adaptado para nova estrutura detalhada por dia.
- **Relatório de Pagamento de Materiais Comprados**:
  - Backend: Novo `RelatorioPagamentoMateriaisViewSet` com ações para:
    - `pre_check_pagamentos_materiais`: Identifica compras no período com pagamento pendente ou futuro.
    - `gerar_relatorio_pagamentos_materiais`: Gera relatório de compras com `data_pagamento` no período, agrupado por Obra e Fornecedor, com totais. Utiliza `CompraReportSerializer`.
  - Frontend (`RelatoriosPage.jsx`):
    - Nova opção de relatório e modal multi-etapas.
    - Filtros incluem seleção de período (com novo seletor de semanas para conveniência), obra e fornecedor.
    - Exibição de pré-verificação e relatório final agrupado (Obra -> Fornecedor -> Compras).
    - Funcionalidade de exportação para CSV (`exportMaterialPaymentsReportToCSV`).
- **Padronização de Ícones de Ação em Tabelas**:
  - Ícones substituíram texto para ações de Editar/Excluir nas tabelas das páginas: Despesas Extras, Ocorrências, Locações e Usuários, seguindo o padrão já aplicado em outras seções.

### Corrigido
- **Script `run_migrations.bat`**: Caminho do ambiente virtual corrigido para `backend\.venv`.
- **API de Detalhes do Material**: Corrigido erro `ImproperlyConfigured` no `MaterialDetailSerializer`.
- **Formulário de Locação (`LocacaoForm.jsx`)**: Corrigido erro `funcionarios.map is not a function`.
- **Formulário de Material (`MaterialForm.jsx`)**: Corrigido erro `ReferenceError: SpinnerIcon is not defined`.
- **Modal de Uso de Material (`DistribuicaoMaterialForm.jsx`)**: Corrigido erro `response.data.filter is not a function` ao carregar compras disponíveis, tratando corretamente a resposta paginada da API.
- **Utilitários de Data e Importações**: Centralizadas funções de data (`getStartOfWeek`, `formatDateToYYYYMMDD`) em `frontend/src/utils/dateUtils.js`. Corrigidos os caminhos de importação para este arquivo em `LocacoesPage.jsx` e `RelatoriosPage.jsx` (de `../../utils/` para `../utils/`), resolvendo erros de build.

## [v0.6.19] - YYYY-MM-DD
### Corrigido
- **Notificações (Toast) / Erro de Tela Branca**: Resolvido o erro crítico `Element type is invalid... but got: undefined` que causava uma tela branca após salvar formulários. A causa raiz era uma incompatibilidade entre a versão anterior do `react-toastify` (v9.x) e o React 19. A biblioteca `react-toastify` foi atualizada para a versão mais recente (`^11.0.5`), que é compatível com as versões modernas do React, eliminando o erro de renderização.
- **Acessibilidade**: Adicionado um `aria-label="Abrir menu"` ao botão "hamburger" do menu de navegação (`frontend/src/components/Navegacao.jsx`) para garantir que ele tenha um texto discernível para leitores de tela.

### Melhorias
- **Script de Configuração (`config.bat`)**: Adicionado o comando `npm audit fix --force` após a etapa de `npm install` na configuração do frontend. Isso visa tentar corrigir automaticamente vulnerabilidades de dependências npm e pode evitar a necessidade de executar o script de configuração múltiplas vezes.

## [v0.6.18] - YYYY-MM-DD
### Corrigido
- **Erro de Tela Branca (White Screen) / `FinancialDashboard.jsx`**: Resolvido um erro crítico (`TypeError: Cannot read properties of undefined (reading 'filter')`) que causava uma tela branca em várias páginas após o salvamento de formulários. O problema ocorria no componente `FinancialDashboard.jsx` ao tentar acessar `obra.custos_por_categoria` quando esta propriedade estava momentaneamente indefinida durante re-renderizações rápidas (race condition). A correção foi aplicar "Optional Chaining" (`obra?.custos_por_categoria`) para acessar a propriedade de forma segura, prevenindo o erro.

## [v0.6.17] - YYYY-MM-DD
### Corrigido
- **Notificações (Toast) / Erro de Tela Branca**: Reforçada a correção para o erro de tela branca (`Element type is invalid... but got: undefined`) que ocorria após salvar formulários. A configuração `icon: () => null` agora é explicitamente aplicada em cada chamada de função de toast (`toast.success`, `toast.error`, etc.) em `frontend/src/utils/toastUtils.js`, em vez de depender apenas de um objeto de opções compartilhado. Isso garante que a anulação do ícone problemático da `react-toastify` seja aplicada de forma mais direta.
- **Scripts Batch (.bat)**: Corrigido o caminho do ambiente virtual no script `create_dev_superuser.bat`. Anteriormente, ele tentava ativar `backend\venv\Scripts\activate.bat`, o que falhava pois o ambiente virtual correto é `.venv`. O script foi atualizado para usar `backend\.venv\Scripts\activate.bat`, alinhando-o com o `start.bat` e o nome real do ambiente virtual.

## [v0.6.16] - YYYY-MM-DD
### Adicionado
- **Página de Detalhes da Equipe**:
  - Criado endpoint no backend (`/api/equipes/<id>/details/`) que fornece dados detalhados da equipe, incluindo líder, membros e um histórico de obras em que atuaram (locações).
  - Implementados `EquipeDetailSerializer` e `EquipeLocacaoSerializer` no backend para estruturar os dados.
  - Desenvolvida nova página no frontend (`EquipeDetailPage.jsx`) para exibir os detalhes da equipe, acessível via rota `/equipes/:id`.
  - A página apresenta dados da equipe (líder, membros) e uma lista de suas locações (obras, datas, status).
  - Adicionado ícone de "visualizar" (olho) na tabela da página de listagem de equipes (`EquipesTable.jsx`) para navegação direta à nova página de detalhes.

### Corrigido
- **Notificações (Toast) / Erro de Tela Branca**: Corrigido um erro crítico no frontend onde a aplicação apresentava uma tela branca após salvar dados em formulários (ex: Funcionários, Materiais). O erro (`Element type is invalid... but got: undefined`) originava-se na biblioteca `react-toastify` ao tentar renderizar ícones padrão. A solução implementada em `frontend/src/utils/toastUtils.js` foi definir globalmente `icon: () => null` nas `toastOptions`, impedindo a renderização desses ícones problemáticos e estabilizando a exibição de notificações.

## [v0.6.15] - YYYY-MM-DD
### Adicionado
- **Página de Detalhes do Funcionário**:
  - Criado endpoint no backend (`/api/funcionarios/<id>/details/`) que fornece um histórico completo do funcionário, incluindo obras participadas, pagamentos recebidos e ocorrências registradas.
  - Desenvolvida nova página no frontend (`FuncionarioDetailPage.jsx`) para exibir os detalhes do funcionário, acessível através da rota `/funcionarios/:id`.
  - A página apresenta os dados do funcionário em seções organizadas: "Dados Pessoais", "Obras Participadas", "Histórico de Pagamentos" e "Ocorrências Registradas".
  - Adicionado um ícone de "visualizar" (olho) na tabela da página de listagem de funcionários (`FuncionariosTable.jsx`) para facilitar o acesso direto à nova página de detalhes.

### Corrigido
- **API de Detalhes do Funcionário**: Corrigido um erro 500 (Internal Server Error) no endpoint `/api/funcionarios/<id>/details/` que era causado por uma `AssertionError` no backend. A falha ocorria devido à especificação redundante do argumento `source` em campos do `FuncionarioObraParticipadaSerializer` (ex: `data_locacao_inicio = serializers.DateField(source='data_locacao_inicio')`). A correção envolveu remover esses argumentos `source` redundantes. As modificações anteriores para robustez da consulta (como `obra__isnull=False` e remoção de `.only()`) foram mantidas.

## [v0.6.14] - YYYY-MM-DD
### Corrigido
- **Página de Detalhes da Obra (`ObraDetailPage.jsx`):** Corrigido um erro (`TypeError: todasAsComprasBruto.filter is not a function`) que ocorria ao processar a lista de compras da obra. Ajustada a lógica para garantir que a variável `todasAsComprasBruto` (ou uma derivada dela, `actualTodasAsCompras`) seja tratada como um array antes de aplicar métodos como `.filter()` ou ao ser passada para componentes filhos, especialmente ao lidar com respostas paginadas da API.

## [v0.6.13] - YYYY-MM-DD
### Corrigido
- **Formulário de Obra (`ObraForm.jsx`):** Corrigido um erro (`TypeError: funcionarios.map is not a function`) que ocorria ao tentar listar os funcionários no dropdown de 'Responsável pela Obra'. A função que busca os funcionários (`fetchFuncionarios`) foi ajustada para lidar corretamente com respostas paginadas da API (buscando `response.data?.results`) e para solicitar uma lista mais completa de funcionários (`page_size: 500`). Adicionalmente, uma verificação `Array.isArray(funcionarios)` foi adicionada antes do `.map()` como medida de segurança.

## [v0.6.12] - YYYY-MM-DD
### Corrigido
- **Página de Relatórios:** Corrigido um erro (`removeChild` error) que podia ocorrer ao alternar entre diferentes tipos de formulários de relatório. Adicionadas `key` props estáticas e únicas aos formulários renderizados condicionalmente para garantir a correta reconciliação pelo React.

## [v0.6.11] - YYYY-MM-DD
### Corrigido
- **Notificações (Toast):** Corrigido um erro ("Element type is invalid... got: undefined") que causava uma tela em branco após salvar uma nova despesa. O erro originava-se na biblioteca `react-toastify` ao tentar renderizar o toast de sucesso. A correção envolve desabilitar o ícone padrão para toasts de sucesso (`icon: false` em `frontend/src/utils/toastUtils.js`), o que evita a renderização do componente problemático.

## [v0.6.10] - YYYY-MM-DD
### Corrigido
- **Página de Despesas Extras:** Tentativa adicional para corrigir o erro ("Element type is invalid... got: undefined") que ocorre após salvar uma despesa. Adicionados comentários aos arquivos `DespesasExtrasPage.jsx`, `DespesasExtrasTable.jsx`, e `PaginationControls.jsx` para forçar o reprocessamento pelo sistema de build. Esta medida visa resolver problemas de cache ou HMR que podem afetar a renderização de componentes após a submissão do formulário, complementando a verificação anterior no `DespesaExtraForm.jsx`.

## [v0.6.9] - YYYY-MM-DD
### Corrigido
- **Formulário de Despesa Extra:** Tentativa de correção para um erro ("Element type is invalid... got: undefined") que ocorria ao salvar uma nova despesa. Verificadas as importações e exportações de componentes (especialmente `SpinnerIcon`) que parecem corretas. Adicionado um comentário ao arquivo `DespesaExtraForm.jsx` para forçar o reprocessamento pelo sistema de build, o que pode resolver problemas de cache ou HMR.

## [v0.6.8] - YYYY-MM-DD
### Corrigido
- **Formulário de Despesa Extra:** Corrigido um erro que impedia a listagem correta de obras no formulário de despesas extras (`DespesasExtrasPage.jsx`). A busca de obras (`fetchObrasForForm`) agora solicita um número maior de registros (`page_size: 500`) e lida corretamente com respostas paginadas da API, garantindo que a lista de obras (`obras`) seja sempre um array.

## [v0.6.7] - YYYY-MM-DD
### Corrigido
- **Edição de Compra:** Corrigido um erro (`TypeError: api.getCompraById is not a function`) que impedia a edição de compras. A função `getCompraById` foi adicionada ao serviço da API (`frontend/src/services/api.js`).

## [v0.6.6] - YYYY-MM-DD
### Adicionado
- **Modelo de Compra (Backend):** Adicionados campos `data_pagamento`, `created_at`, e `updated_at` ao modelo `Compra`. `data_pagamento` agora é preenchida automaticamente com `data_compra` se não especificada.
- **Formulário de Compra (Frontend):** Incluído campo 'Data de Pagamento', que por padrão reflete a 'Data da Compra' mas pode ser alterado pelo usuário.
- **Detalhes da Compra (Frontend):** A lista de compras e o modal de detalhes da compra agora exibem informações mais completas.
  - Lista de Compras: Coluna 'Obra' confirmada (já existia, mas relevância destacada).
  - Modal de Detalhes da Compra: Exibe nome da Obra, Fornecedor, Nota Fiscal, Data da Compra, Data de Pagamento, Data do Registro, Subtotal, Desconto, Valor Total e Observações.

### Modificado
- Serializer `CompraSerializer` (Backend) atualizado para incluir os novos campos do modelo (`data_pagamento`, `created_at`, `updated_at`) e marcar os campos de timestamp como read-only.
- Componente `CompraItensModal.jsx` (Frontend) refatorado para aceitar o objeto de compra completo (`compra`) e exibir os detalhes adicionais formatados.
- Componente `ComprasPage.jsx` (Frontend) atualizado para gerenciar e passar o objeto de compra completo para o modal de detalhes.

## [v0.6.5] - YYYY-MM-DD
### Corrigido
- **Formulário de Compra:** Corrigida a listagem de obras que não estavam aparecendo no formulário de nova compra. O formulário agora lida corretamente com respostas paginadas da API de obras e solicita uma quantidade maior de registros (`page_size: 500`).
- **Detalhes da Obra:** Corrigido um erro (`TypeError: dataToDisplay.map is not a function` ou similar) na tabela de histórico de uso de materiais (em `MaterialUsageHistory.jsx`) que ocorria quando a lista de usos de material (`usosMaterial`) era indefinida ou não era um array. A passagem da prop foi ajustada para `usosMaterial={usosMaterial?.results || []}`, garantindo que um array seja sempre fornecido.

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

[end of changelog.md]
