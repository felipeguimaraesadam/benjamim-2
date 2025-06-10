# Changelog

## [Unreleased] - 2025-06-10

### Added
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
- Replaced previous general startup scripts with a Windows-specific two-script system (`config.bat` for setup, `start.bat` for execution).
- `README.md` updated to focus entirely on the new Windows-specific `config.bat` and `start.bat` workflow.

### Removed
- Deleted `start.sh` (previous Linux/macOS specific startup script).
- Deleted the first version of `start.bat` (which was a general setup and execution script for Windows).

---
Formato do Changelog baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).
