# Changelog

## [Unreleased] - 2025-06-10

### Added
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
- Navegação principal (`Navegacao.jsx`) reorganizada com agrupamentos lógicos ("Cadastros", "Financeiro", "Operacional") e ícones para melhor usabilidade.
- Botão "Visualizar" na tabela de obras agora direciona para a nova página de Detalhes da Obra.
- `planejamento.md` atualizado para refletir o progresso atual das funcionalidades e adicionar uma seção de "Próximos Passos".
- Replaced previous general startup scripts with a Windows-specific two-script system (`config.bat` for setup, `start.bat` for execution).
- `README.md` updated to focus entirely on the new Windows-specific `config.bat` and `start.bat` workflow.

### Fixed
- Corrigido o formulário de edição de obra que não carregava os dados existentes ao ser aberto para um registro existente.

### Removed
- Link "Documentos" removido da navegação principal (`Navegacao.jsx`), pois a funcionalidade não será implementada.
- Deleted `start.sh` (previous Linux/macOS specific startup script).
- Deleted the first version of `start.bat` (which was a general setup and execution script for Windows).

---
Formato do Changelog baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).
