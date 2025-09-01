@echo off
echo ========================================
echo    SCRIPT DE ATUALIZACAO DO PROJETO
echo ========================================
echo.

echo Verificando status do repositorio...
git status
echo.

echo Buscando atualizacoes do GitHub...
git fetch origin
echo.

echo Salvando branch atual...
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
echo Branch atual: %CURRENT_BRANCH%
echo.

echo Forcando pull das atualizacoes mais recentes...
git reset --hard origin/%CURRENT_BRANCH%
if %errorlevel% neq 0 (
    echo ERRO: Falha ao fazer pull das atualizacoes!
    pause
    exit /b 1
)
echo.

echo ========================================
echo    ATUALIZACAO CONCLUIDA COM SUCESSO!
echo ========================================
echo.
echo O projeto foi atualizado com as ultimas mudancas do GitHub.
echo.
echo Chamando script de configuracao (config.bat)...
call scripts\config.bat
echo.
echo Pressione qualquer tecla para continuar...
pause >nul