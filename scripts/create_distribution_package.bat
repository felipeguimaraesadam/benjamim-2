@echo off
setlocal enabledelayedexpansion

REM Script para criar pacote de distribuição completo
echo [INFO] Criando pacote de distribuição para outro PC...

set "DIST_FOLDER=SGO_Distribution"
cd /d "%~dp0\.."
set "PROJECT_ROOT=%cd%"

REM Limpar pasta de distribuição anterior
if exist "%PROJECT_ROOT%\%DIST_FOLDER%" (
    echo [INFO] Removendo distribuição anterior...
    rd /s /q "%PROJECT_ROOT%\%DIST_FOLDER%"
)

REM Criar estrutura de distribuição
echo [INFO] Criando estrutura de distribuição...
mkdir "%PROJECT_ROOT%\%DIST_FOLDER%"
mkdir "%PROJECT_ROOT%\%DIST_FOLDER%\projeto"
mkdir "%PROJECT_ROOT%\%DIST_FOLDER%\executavel"

REM Copiar projeto completo (exceto pastas pesadas)
echo [INFO] Copiando arquivos do projeto...
xcopy "%PROJECT_ROOT%\backend" "%PROJECT_ROOT%\%DIST_FOLDER%\projeto\backend\" /s /e /i /y
xcopy "%PROJECT_ROOT%\frontend" "%PROJECT_ROOT%\%DIST_FOLDER%\projeto\frontend\" /s /e /i /y
xcopy "%PROJECT_ROOT%\scripts" "%PROJECT_ROOT%\%DIST_FOLDER%\projeto\scripts\" /s /e /i /y
if exist "%PROJECT_ROOT%\.gitignore" copy "%PROJECT_ROOT%\.gitignore" "%PROJECT_ROOT%\%DIST_FOLDER%\projeto\"
if exist "%PROJECT_ROOT%\README.md" copy "%PROJECT_ROOT%\README.md" "%PROJECT_ROOT%\%DIST_FOLDER%\projeto\"

REM Remover pastas desnecessárias
echo [INFO] Limpando arquivos desnecessários...
if exist "%PROJECT_ROOT%\%DIST_FOLDER%\projeto\backend\.venv" rd /s /q "%PROJECT_ROOT%\%DIST_FOLDER%\projeto\backend\.venv"
if exist "%PROJECT_ROOT%\%DIST_FOLDER%\projeto\frontend\node_modules" rd /s /q "%PROJECT_ROOT%\%DIST_FOLDER%\projeto\frontend\node_modules"
if exist "%PROJECT_ROOT%\%DIST_FOLDER%\projeto\backend\db.sqlite3" del "%PROJECT_ROOT%\%DIST_FOLDER%\projeto\backend\db.sqlite3"

REM Copiar executável se existir
if exist "%PROJECT_ROOT%\dist_pyinstaller\SGO_Gestao_Obras" (
    echo [INFO] Copiando executável...
    xcopy "%PROJECT_ROOT%\dist_pyinstaller\SGO_Gestao_Obras" "%PROJECT_ROOT%\%DIST_FOLDER%\executavel\" /s /e /i /y
) else (
    echo [WARNING] Executável não encontrado. Execute build_executable.bat primeiro.
)

REM Criar arquivo de instruções
echo [INFO] Criando arquivo de instruções...
echo # SGO Gestão de Obras - Pacote de Distribuição > "%PROJECT_ROOT%\%DIST_FOLDER%\INSTRUCOES.md"
echo. >> "%PROJECT_ROOT%\%DIST_FOLDER%\INSTRUCOES.md"
echo ## Opção 1: Executar o Aplicativo Pronto >> "%PROJECT_ROOT%\%DIST_FOLDER%\INSTRUCOES.md"
echo. >> "%PROJECT_ROOT%\%DIST_FOLDER%\INSTRUCOES.md"
echo 1. Navegue para a pasta `executavel` >> "%PROJECT_ROOT%\%DIST_FOLDER%\INSTRUCOES.md"
echo 2. Execute `SGO_Gestao_Obras.exe` >> "%PROJECT_ROOT%\%DIST_FOLDER%\INSTRUCOES.md"
echo 3. Acesse http://localhost:8000 no navegador >> "%PROJECT_ROOT%\%DIST_FOLDER%\INSTRUCOES.md"
echo. >> "%PROJECT_ROOT%\%DIST_FOLDER%\INSTRUCOES.md"
echo ## Opção 2: Executar em Modo Desenvolvimento >> "%PROJECT_ROOT%\%DIST_FOLDER%\INSTRUCOES.md"
echo. >> "%PROJECT_ROOT%\%DIST_FOLDER%\INSTRUCOES.md"
echo 1. Navegue para a pasta `projeto` >> "%PROJECT_ROOT%\%DIST_FOLDER%\INSTRUCOES.md"
echo 2. Execute `scripts\start.bat` >> "%PROJECT_ROOT%\%DIST_FOLDER%\INSTRUCOES.md"
echo 3. Acesse http://localhost:5173 no navegador >> "%PROJECT_ROOT%\%DIST_FOLDER%\INSTRUCOES.md"
echo. >> "%PROJECT_ROOT%\%DIST_FOLDER%\INSTRUCOES.md"
echo ## Opção 3: Gerar Novo Executável >> "%PROJECT_ROOT%\%DIST_FOLDER%\INSTRUCOES.md"
echo. >> "%PROJECT_ROOT%\%DIST_FOLDER%\INSTRUCOES.md"
echo 1. Navegue para a pasta `projeto` >> "%PROJECT_ROOT%\%DIST_FOLDER%\INSTRUCOES.md"
echo 2. Execute `scripts\build_executable.bat` >> "%PROJECT_ROOT%\%DIST_FOLDER%\INSTRUCOES.md"
echo 3. O executável será criado em `dist_pyinstaller\SGO_Gestao_Obras\` >> "%PROJECT_ROOT%\%DIST_FOLDER%\INSTRUCOES.md"

echo [INFO] Pacote de distribuição criado em: %PROJECT_ROOT%\%DIST_FOLDER%
echo [INFO] Compacte esta pasta e envie para o outro PC.

:eof
endlocal