#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import Compra, Obra, Material, ItemCompra
from decimal import Decimal
from datetime import date

def test_infinity_bug():
    print("=== TESTE DE REPRODUÇÃO DO BUG DOS NÚMEROS INFINITOS ===")
    
    try:
        # Buscar dados existentes
        obra = Obra.objects.first()
        material = Material.objects.first()
        
        print(f"Obra encontrada: {obra.nome_obra if obra else 'Nenhuma'}")
        print(f"Material encontrado: {material.nome if material else 'Nenhum'}")
        
        if not obra:
            print("ERRO: Nenhuma obra encontrada no banco")
            return
            
        # Teste com valores que podem gerar infinito
        test_cases = [
            {
                'nome': 'Caso 1: Entrada zero, 3 parcelas',
                'total': Decimal('1000.00'),
                'entrada': Decimal('0.00'),
                'parcelas': 3
            },
            {
                'nome': 'Caso 2: Entrada igual ao total',
                'total': Decimal('1000.00'),
                'entrada': Decimal('1000.00'),
                'parcelas': 2
            },
            {
                'nome': 'Caso 3: Total zero',
                'total': Decimal('0.00'),
                'entrada': Decimal('0.00'),
                'parcelas': 1
            }
        ]
        
        for i, case in enumerate(test_cases, 1):
            print(f"\n--- {case['nome']} ---")
            
            try:
                # Criar compra
                compra = Compra.objects.create(
                    obra=obra,
                    fornecedor=f'Fornecedor Teste {i}',
                    data_compra=date.today(),
                    nota_fiscal=f'NF-TEST-{i}',
                    valor_total_bruto=case['total'],
                    valor_desconto=Decimal('0.00'),
                    valor_total_liquido=case['total'],
                    valor_entrada=case['entrada'],
                    forma_pagamento='PARCELADO',
                    numero_parcelas=case['parcelas']
                )
                
                print(f"Compra {compra.id} criada com sucesso")
                
                # Adicionar item se material existir
                if material:
                    ItemCompra.objects.create(
                        compra=compra,
                        material=material,
                        quantidade=Decimal('1.0'),
                        valor_unitario=case['total'],
                        categoria_uso='Geral'
                    )
                    print("Item adicionado à compra")
                
                # Tentar criar parcelas
                print("Criando parcelas...")
                compra.create_installments()
                
                # Verificar parcelas criadas
                parcelas = compra.parcelas.all()
                print(f"Parcelas criadas: {parcelas.count()}")
                
                for parcela in parcelas:
                    valor = parcela.valor_parcela
                    valor_float = float(valor)
                    
                    # Verificar se é infinito ou NaN
                    if valor_float == float('inf'):
                        print(f"✗ ERRO: Parcela {parcela.numero_parcela} = +INFINITO")
                    elif valor_float == float('-inf'):
                        print(f"✗ ERRO: Parcela {parcela.numero_parcela} = -INFINITO")
                    elif valor_float != valor_float:  # NaN check
                        print(f"✗ ERRO: Parcela {parcela.numero_parcela} = NaN")
                    else:
                        print(f"✓ Parcela {parcela.numero_parcela}: R$ {valor}")
                        
            except Exception as e:
                print(f"✗ ERRO no caso {i}: {str(e)}")
                import traceback
                traceback.print_exc()
                
        print("\n=== TESTE CONCLUÍDO ===")
        
    except Exception as e:
        print(f"Erro geral: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_infinity_bug()