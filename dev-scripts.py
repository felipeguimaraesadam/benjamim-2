#!/usr/bin/env python3
"""
Scripts de desenvolvimento para o projeto SGO
Esses scripts funcionam localmente sem interferir no deploy na nuvem
"""

import os
import sys
import subprocess
import platform
import time
from pathlib import Path

# Configurações
PROJECT_ROOT = Path(__file__).parent
BACKEND_DIR = PROJECT_ROOT / "backend"
FRONTEND_DIR = PROJECT_ROOT / "frontend"

def run_command(command, cwd=None, shell=True):
    """Executa um comando e retorna o resultado"""
    try:
        result = subprocess.run(
            command,
            cwd=cwd,
            shell=shell,
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Erro ao executar comando: {command}")
        print(f"Erro: {e.stderr}")
        return None

def check_dependencies():
    """Verifica se as dependências estão instaladas"""
    print("🔍 Verificando dependências...")
    
    # Verificar Python
    python_version = sys.version_info
    if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 8):
        print("❌ Python 3.8+ é necessário")
        return False
    print(f"✅ Python {python_version.major}.{python_version.minor}")
    
    # Verificar Node.js
    try:
        node_version = run_command("node --version")
        if node_version:
            print(f"✅ Node.js {node_version.strip()}")
        else:
            print("❌ Node.js não encontrado")
            return False
    except:
        print("❌ Node.js não encontrado")
        return False
    
    return True

def setup_backend():
    """Configura o ambiente do backend"""
    print("\n🐍 Configurando backend...")
    
    # Verificar se o virtual environment existe
    venv_path = BACKEND_DIR / "venv"
    if not venv_path.exists():
        print("📦 Criando virtual environment...")
        run_command(f"python -m venv {venv_path}", cwd=BACKEND_DIR)
    
    # Ativar virtual environment e instalar dependências
    if platform.system() == "Windows":
        activate_script = venv_path / "Scripts" / "activate.bat"
        pip_path = venv_path / "Scripts" / "pip.exe"
    else:
        activate_script = venv_path / "bin" / "activate"
        pip_path = venv_path / "bin" / "pip"
    
    if pip_path.exists():
        print("📦 Instalando dependências do backend...")
        run_command(f"{pip_path} install -r requirements.txt", cwd=BACKEND_DIR)
        print("✅ Backend configurado")
    else:
        print("❌ Erro ao configurar virtual environment")
        return False
    
    return True

def setup_frontend():
    """Configura o ambiente do frontend"""
    print("\n⚛️ Configurando frontend...")
    
    # Verificar se node_modules existe
    node_modules = FRONTEND_DIR / "node_modules"
    if not node_modules.exists():
        print("📦 Instalando dependências do frontend...")
        run_command("npm install", cwd=FRONTEND_DIR)
    
    print("✅ Frontend configurado")
    return True

def run_migrations():
    """Executa as migrações do Django"""
    print("\n🗄️ Executando migrações...")
    
    venv_path = BACKEND_DIR / "venv"
    if platform.system() == "Windows":
        python_path = venv_path / "Scripts" / "python.exe"
    else:
        python_path = venv_path / "bin" / "python"
    
    if python_path.exists():
        # Fazer migrações
        run_command(f"{python_path} manage.py makemigrations", cwd=BACKEND_DIR)
        run_command(f"{python_path} manage.py migrate", cwd=BACKEND_DIR)
        print("✅ Migrações executadas")
        return True
    else:
        print("❌ Python do virtual environment não encontrado")
        return False

def create_superuser():
    """Cria um superusuário se não existir"""
    print("\n👤 Verificando superusuário...")
    
    venv_path = BACKEND_DIR / "venv"
    if platform.system() == "Windows":
        python_path = venv_path / "Scripts" / "python.exe"
    else:
        python_path = venv_path / "bin" / "python"
    
    if python_path.exists():
        # Verificar se já existe um superusuário
        check_cmd = f"{python_path} manage.py shell -c \"from core.models import Usuario; print(Usuario.objects.filter(nivel_acesso='admin').exists())\""
        result = run_command(check_cmd, cwd=BACKEND_DIR)
        
        if result and "True" not in result:
            print("📝 Criando superusuário padrão...")
            create_cmd = f"{python_path} manage.py shell -c \"from core.models import Usuario; Usuario.objects.create_user(login='admin', nome_completo='Administrador', password='admin123', nivel_acesso='admin')\""
            run_command(create_cmd, cwd=BACKEND_DIR)
            print("✅ Superusuário criado (login: admin, senha: admin123)")
        else:
            print("✅ Superusuário já existe")
        
        return True
    else:
        print("❌ Python do virtual environment não encontrado")
        return False

def start_development():
    """Inicia os servidores de desenvolvimento"""
    print("\n🚀 Iniciando servidores de desenvolvimento...")
    print("\n📋 Instruções:")
    print("1. Backend estará disponível em: http://127.0.0.1:8000")
    print("2. Frontend estará disponível em: http://localhost:3000")
    print("3. Use Ctrl+C para parar os servidores")
    print("\n" + "="*50)
    
    # Comandos para iniciar os servidores
    venv_path = BACKEND_DIR / "venv"
    if platform.system() == "Windows":
        python_path = venv_path / "Scripts" / "python.exe"
        backend_cmd = f"{python_path} manage.py runserver"
    else:
        python_path = venv_path / "bin" / "python"
        backend_cmd = f"{python_path} manage.py runserver"
    
    frontend_cmd = "npm run dev"
    
    print(f"\n🐍 Para iniciar o backend, execute:")
    print(f"   cd {BACKEND_DIR}")
    print(f"   {backend_cmd}")
    
    print(f"\n⚛️ Para iniciar o frontend, execute:")
    print(f"   cd {FRONTEND_DIR}")
    print(f"   {frontend_cmd}")
    
    print("\n💡 Dica: Abra dois terminais separados para executar ambos os comandos")

def setup_environment():
    """Configura todo o ambiente de desenvolvimento"""
    print("🔧 Configurando ambiente de desenvolvimento do SGO")
    print("="*50)
    
    if not check_dependencies():
        print("\n❌ Dependências não atendidas. Instale Python 3.8+ e Node.js")
        return False
    
    if not setup_backend():
        print("\n❌ Erro ao configurar backend")
        return False
    
    if not setup_frontend():
        print("\n❌ Erro ao configurar frontend")
        return False
    
    if not run_migrations():
        print("\n❌ Erro ao executar migrações")
        return False
    
    if not create_superuser():
        print("\n❌ Erro ao criar superusuário")
        return False
    
    print("\n✅ Ambiente configurado com sucesso!")
    start_development()
    return True

def clean_environment():
    """Limpa o ambiente de desenvolvimento"""
    print("🧹 Limpando ambiente de desenvolvimento...")
    
    # Remover virtual environment
    venv_path = BACKEND_DIR / "venv"
    if venv_path.exists():
        import shutil
        shutil.rmtree(venv_path)
        print("✅ Virtual environment removido")
    
    # Remover node_modules
    node_modules = FRONTEND_DIR / "node_modules"
    if node_modules.exists():
        import shutil
        shutil.rmtree(node_modules)
        print("✅ Node modules removidos")
    
    # Remover arquivos de cache
    cache_dirs = [
        BACKEND_DIR / "__pycache__",
        BACKEND_DIR / "core" / "__pycache__",
        BACKEND_DIR / "sgo_core" / "__pycache__",
    ]
    
    for cache_dir in cache_dirs:
        if cache_dir.exists():
            import shutil
            shutil.rmtree(cache_dir)
    
    print("✅ Ambiente limpo")

def main():
    """Função principal"""
    if len(sys.argv) < 2:
        print("Uso: python dev-scripts.py [setup|clean|start]")
        print("\nComandos disponíveis:")
        print("  setup  - Configura todo o ambiente de desenvolvimento")
        print("  clean  - Limpa o ambiente de desenvolvimento")
        print("  start  - Mostra instruções para iniciar os servidores")
        return
    
    command = sys.argv[1]
    
    if command == "setup":
        setup_environment()
    elif command == "clean":
        clean_environment()
    elif command == "start":
        start_development()
    else:
        print(f"Comando desconhecido: {command}")
        print("Use: setup, clean ou start")

if __name__ == "__main__":
    main()