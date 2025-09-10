#!/usr/bin/env python
"""
Otimizações de memória para o Django no Render
"""

import os
import gc
from django.core.management import execute_from_command_line

def optimize_memory():
    """
    Aplica otimizações de memória para o ambiente de produção
    """
    # Configurações de otimização de memória
    os.environ.setdefault('PYTHONOPTIMIZE', '1')
    os.environ.setdefault('PYTHONDONTWRITEBYTECODE', '1')
    os.environ.setdefault('PYTHONUNBUFFERED', '1')
    
    # Configurações específicas do Django para economizar memória
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
    
    # Forçar garbage collection
    gc.collect()
    
    print("Otimizações de memória aplicadas com sucesso!")

if __name__ == '__main__':
    optimize_memory()