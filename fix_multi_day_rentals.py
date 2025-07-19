#!/usr/bin/env python
"""
Script para corrigir locações com múltiplos dias existentes no banco de dados.
Este script identifica locações onde data_locacao_inicio != data_locacao_fim
e as divide em locações individuais por dia.
"""

import os
import sys
import django
from datetime import timedelta
from decimal import Decimal

# Configurar Django
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from django.db import transaction
from core.models import Locacao_Obras_Equipes

def fix_multi_day_rentals():
    """
    Identifica e corrige locações com múltiplos dias dividindo-as em locações diárias.
    """
    print("🔍 Procurando locações com múltiplos dias...")
    
    # Buscar locações onde data_locacao_inicio != data_locacao_fim
    multi_day_rentals = Locacao_Obras_Equipes.objects.filter(
        data_locacao_inicio__lt=models.F('data_locacao_fim')
    ).select_related('obra', 'funcionario_locado', 'equipe')
    
    if not multi_day_rentals.exists():
        print("✅ Nenhuma locação com múltiplos dias encontrada. Banco de dados já está correto!")
        return
    
    print(f"📋 Encontradas {multi_day_rentals.count()} locações com múltiplos dias:")
    
    for rental in multi_day_rentals:
        # Determinar tipo de recurso
        if rental.funcionario_locado:
            recurso = f"Funcionário: {rental.funcionario_locado.nome_completo}"
        elif rental.equipe:
            recurso = f"Equipe: {rental.equipe.nome_equipe}"
        else:
            recurso = f"Serviço: {rental.servico_externo}"
        
        days_count = (rental.data_locacao_fim - rental.data_locacao_inicio).days + 1
        print(f"   - ID {rental.id}: {recurso} - {rental.obra.nome_obra} ({rental.data_locacao_inicio} a {rental.data_locacao_fim}) - {days_count} dias")
    
    print("\n⚠️  ATENÇÃO: Este script irá:")
    print("   1. Dividir cada locação multi-dia em locações diárias separadas")
    print("   2. Manter todos os dados originais (obra, recurso, valores, etc.)")
    print("   3. Remover as locações multi-dia originais")
    print("   4. Criar novas locações individuais para cada dia")
    
    confirm = input("\n❓ Deseja continuar? (s/N): ").strip().lower()
    if confirm not in ['s', 'sim', 'y', 'yes']:
        print("❌ Operação cancelada pelo usuário.")
        return
    
    print("\n🔧 Iniciando correção das locações...")
    
    fixed_count = 0
    created_count = 0
    
    with transaction.atomic():
        for rental in multi_day_rentals:
            # Calcular número de dias
            start_date = rental.data_locacao_inicio
            end_date = rental.data_locacao_fim
            days_count = (end_date - start_date).days + 1
            
            # Determinar tipo de recurso para log
            if rental.funcionario_locado:
                recurso = f"Funcionário: {rental.funcionario_locado.nome_completo}"
            elif rental.equipe:
                recurso = f"Equipe: {rental.equipe.nome_equipe}"
            else:
                recurso = f"Serviço: {rental.servico_externo}"
            
            print(f"   📅 Dividindo locação ID {rental.id} ({recurso}) em {days_count} dias...")
            
            # Criar locações diárias
            current_date = start_date
            daily_rentals_created = 0
            
            while current_date <= end_date:
                # Criar nova locação para o dia atual
                new_rental = Locacao_Obras_Equipes.objects.create(
                    obra=rental.obra,
                    funcionario_locado=rental.funcionario_locado,
                    equipe=rental.equipe,
                    servico_externo=rental.servico_externo,
                    data_locacao_inicio=current_date,
                    data_locacao_fim=current_date,
                    tipo_pagamento=rental.tipo_pagamento,
                    valor_pagamento=rental.valor_pagamento,
                    data_pagamento=rental.data_pagamento,
                    observacoes=rental.observacoes,
                    status_locacao=rental.status_locacao
                )
                
                daily_rentals_created += 1
                current_date += timedelta(days=1)
            
            # Remover a locação multi-dia original
            rental.delete()
            
            print(f"      ✅ Criadas {daily_rentals_created} locações diárias")
            fixed_count += 1
            created_count += daily_rentals_created
    
    print(f"\n🎉 Correção concluída com sucesso!")
    print(f"📊 Resumo:")
    print(f"   - {fixed_count} locações multi-dia corrigidas")
    print(f"   - {created_count} locações diárias criadas")
    print(f"\n💡 Agora todas as locações estão divididas por dia individual.")
    print(f"   Você pode testar movendo locações no planejamento semanal!")

if __name__ == '__main__':
    try:
        # Importar models após setup do Django
        from django.db import models
        fix_multi_day_rentals()
    except Exception as e:
        print(f"❌ Erro ao executar script: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)