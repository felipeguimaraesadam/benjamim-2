import os
import sys
import django
from datetime import date
from decimal import Decimal

# Configurar o Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from core.models import Compra, ParcelaCompra, Obra

def test_installment_payment():
    print("=== TESTE DE PAGAMENTO PARCELADO ===")
    
    # Buscar uma obra existente ou criar uma nova
    try:
        obra = Obra.objects.first()
        if not obra:
            obra = Obra.objects.create(
                nome_obra='Obra Teste',
                endereco_completo='Endereço Teste',
                cidade='Cidade Teste',
                status='Em Andamento'
            )
            print(f"Obra criada: {obra.nome_obra}")
        else:
            print(f"Usando obra existente: {obra.nome_obra}")
    except Exception as e:
        print(f"Erro ao buscar/criar obra: {e}")
        return
    
    # Criar uma compra com pagamento parcelado
    try:
        compra = Compra.objects.create(
            obra=obra,
            fornecedor='Fornecedor Teste',
            data_compra=date.today(),
            valor_total_bruto=Decimal('1000.00'),
            desconto=Decimal('0.00'),
            forma_pagamento='PARCELADO',
            numero_parcelas=3,
            valor_entrada=Decimal('200.00')
        )
        
        print(f"\nCompra criada:")
        print(f"  ID: {compra.id}")
        print(f"  Forma de pagamento: {compra.forma_pagamento}")
        print(f"  Número de parcelas: {compra.numero_parcelas}")
        print(f"  Valor total líquido: {compra.valor_total_liquido}")
        print(f"  Valor entrada: {compra.valor_entrada}")
        
    except Exception as e:
        print(f"Erro ao criar compra: {e}")
        return
    
    # Verificar se as parcelas foram criadas
    try:
        parcelas = ParcelaCompra.objects.filter(compra=compra)
        print(f"\nNúmero de parcelas criadas: {parcelas.count()}")
        
        for parcela in parcelas:
            print(f"  Parcela {parcela.numero_parcela}: valor={parcela.valor_parcela}, vencimento={parcela.data_vencimento}, status={parcela.status}")
            
    except Exception as e:
        print(f"Erro ao buscar parcelas: {e}")
    
    # Verificar os dados salvos no banco
    try:
        compra_db = Compra.objects.get(id=compra.id)
        print(f"\nDados da compra no banco de dados:")
        print(f"  Forma de pagamento: {compra_db.forma_pagamento}")
        print(f"  Número de parcelas: {compra_db.numero_parcelas}")
        print(f"  Valor entrada: {compra_db.valor_entrada}")
        
    except Exception as e:
        print(f"Erro ao verificar dados no banco: {e}")
    
    # Testar atualização da compra
    try:
        print(f"\n=== TESTE DE ATUALIZAÇÃO ===")
        compra.numero_parcelas = 5
        compra.save()
        
        # Verificar se as parcelas foram recriadas
        parcelas_atualizadas = ParcelaCompra.objects.filter(compra=compra)
        print(f"Parcelas após atualização: {parcelas_atualizadas.count()}")
        
    except Exception as e:
        print(f"Erro ao atualizar compra: {e}")
    
    print("\n=== FIM DO TESTE ===")

if __name__ == '__main__':
    test_installment_payment()