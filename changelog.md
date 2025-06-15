# Changelog

## [Próxima Versão] - 2025-06-15

### Adicionado
- Adicionados campos para valores padrão de diária, metro e empreitada no cadastro de funcionários. Estes valores podem ser sugeridos na tela de locação.

## [Unreleased] - 2025-06-14

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
- Adicionado script `run_migrations.bat` na raiz do projeto para facilitar a execução do comando `python manage.py migrate` do Django.
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
