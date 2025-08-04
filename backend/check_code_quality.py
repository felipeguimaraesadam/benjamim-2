#!/usr/bin/env python3
"""
Script para verificar a qualidade do código Python no projeto SGO.
Executa Black (formatação) e Flake8 (linting) no código.
"""

import subprocess
import sys
from pathlib import Path


def run_command(command, description):
    """Executa um comando e retorna o resultado."""
    print(f"\n🔍 {description}...")
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent,
        )
        if result.returncode == 0:
            print(f"✅ {description} - OK")
            if result.stdout:
                print(result.stdout)
        else:
            print(f"❌ {description} - Problemas encontrados")
            if result.stdout:
                print(result.stdout)
            if result.stderr:
                print(result.stderr)
        return result.returncode == 0
    except Exception as e:
        print(f"❌ Erro ao executar {description}: {e}")
        return False


def main():
    """Função principal do script."""
    print("🚀 Verificando qualidade do código Python...")

    # Verificar se Black está instalado
    black_check = run_command("python -m black --version", "Verificando Black")
    if not black_check:
        print("❌ Black não está instalado. Execute: pip install black")
        return False

    # Verificar se Flake8 está instalado
    flake8_check = run_command("python -m flake8 --version", "Verificando Flake8")
    if not flake8_check:
        print("❌ Flake8 não está instalado. Execute: pip install flake8")
        return False

    # Executar Black (formatação)
    black_format = run_command("python -m black .", "Formatando código com Black")

    # Executar Flake8 (linting)
    flake8_lint = run_command("python -m flake8 .", "Verificando código com Flake8")

    # Resumo
    print("\n📊 Resumo:")
    print(f"  Black (formatação): {'✅ OK' if black_format else '❌ Problemas'}")
    print(f"  Flake8 (linting): {'✅ OK' if flake8_lint else '❌ Problemas'}")

    if black_format and flake8_lint:
        print("\n🎉 Código está em conformidade com os padrões de qualidade!")
        return True
    else:
        print("\n⚠️  Alguns problemas foram encontrados. Verifique os logs acima.")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
