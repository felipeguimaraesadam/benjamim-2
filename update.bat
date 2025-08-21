@echo off
chcp 65001 >nul
echo ========================================
echo    SCRIPT DE ATUALIZAÇÃO DO PROJETO
echo ========================================
echo.

echo [1/5] Verificando status atual do repositório...
git status
echo.

echo [2/5] Buscando atualizações do GitHub...
git fetch --all
if %errorlevel% neq 0 (
    echo ERRO: Falha ao buscar atualizações do GitHub
    pause
    exit /b 1
)

echo [3/5] Salvando branch atual...
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
echo Branch atual: %CURRENT_BRANCH%
echo.

echo [4/5] Forçando pull das atualizações mais recentes...
git reset --hard origin/%CURRENT_BRANCH%
if %errorlevel% neq 0 (
    echo AVISO: Falha ao fazer reset da branch atual, tentando master...
    git reset --hard origin/master
    if %errorlevel% neq 0 (
        echo ERRO: Falha ao forçar pull das atualizações
        pause
        exit /b 1
    )
)
echo.

echo [5/5] Verificando se há mudanças locais para commit...
git add .
git diff --cached --quiet
if %errorlevel% neq 0 (
    echo Fazendo commit das mudanças locais...
    git commit -m "Atualizações locais - %date% %time%"
    if %errorlevel% neq 0 (
        echo AVISO: Falha ao fazer commit das mudanças locais
    )
) else (
    echo Nenhuma mudança local encontrada para commit.
)
echo.

echo [6/7] Fazendo merge na branch master...
if not "%CURRENT_BRANCH%"=="master" (
    git checkout master
    if %errorlevel% neq 0 (
        echo ERRO: Falha ao mudar para branch master
        pause
        exit /b 1
    )
    git merge %CURRENT_BRANCH%
    if %errorlevel% neq 0 (
        echo ERRO: Falha ao fazer merge da branch %CURRENT_BRANCH% na master
        echo Resolvendo conflitos pode ser necessário...
        pause
        exit /b 1
    )
    echo Merge realizado com sucesso!
) else (
    echo Já está na branch master, pulando merge.
)
echo.

echo [7/7] Fazendo push para o GitHub...
git push origin master
if %errorlevel% neq 0 (
    echo ERRO: Falha ao fazer push para o GitHub
    echo Verifique sua conexão e permissões
    pause
    exit /b 1
)
echo.

echo ========================================
echo     ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!
echo ========================================
echo.
echo O projeto foi atualizado com as últimas mudanças do GitHub
echo e suas alterações locais foram enviadas para o repositório.
echo.
echo Pressione qualquer tecla para fechar...
pause >nul