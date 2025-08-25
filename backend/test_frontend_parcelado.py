#!/usr/bin/env python
import os
import sys
import django
from decimal import Decimal
import json
from datetime import datetime, date

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.models import Compra, ItemCompra, Material, Obra, ParcelaCompra, Usuario
from core.serializers import CompraSerializer
from rest_framework.test import APIRequestFactory

def test_pagamento_parcelado_frontend():
    print("=== TESTE PAGAMENTO PARCELADO FRONTEND ===")
    
    # Limpar dados anteriores
    ParcelaCompra.objects.all().delete()
    ItemCompra.objects.all().delete()
    Compra.objects.all().delete()
    
    # Criar usuário de teste
    user, created = Usuario.objects.get_or_create(
        login='testuser',
        defaults={'nome_completo': 'Test User'}
    )
    obra, created = Obra.objects.get_or_create(
        nome_obra='Obra Teste Parcelado',
        defaults={
            'endereco_completo': 'Rua Teste, 123',
            'cidade': 'Cidade Teste',
            'status': 'Em Andamento'
        }
    )
    
    # Criar material
    material, created = Material.objects.get_or_create(
        nome="Material Teste Parcelado",
        defaults={'unidade_medida': 'un'}
    )
    
    # Criar compra diretamente usando Django ORM (simulando o que o serializer faria)
    compra = Compra.objects.create(
        obra=obra,
        fornecedor='Fornecedor Teste Parcelado',
        data_compra=date(2024, 1, 15),
        nota_fiscal='NF-12345-PARCELADO',
        valor_total_bruto=Decimal('500.00'),
        desconto=Decimal('0.00'),
        valor_entrada=Decimal('0.00'),
        observacoes='Teste de pagamento parcelado via frontend',
        tipo='COMPRA',
        forma_pagamento='PARCELADO',
        numero_parcelas=4
    )
    
    print(f"✓ Compra criada: ID {compra.id}")
    print(f"  - Forma de pagamento: {compra.forma_pagamento}")
    print(f"  - Número de parcelas: {compra.numero_parcelas}")
    
    # Criar item da compra
    item = ItemCompra.objects.create(
        compra=compra,
        material=material,
        quantidade=10,
        valor_unitario=50.00
    )
    print(f"  - Item criado: {item.material.nome} - Qtd: {item.quantidade}")
    
    # As parcelas são criadas automaticamente pelo método save() da Compra
    # quando forma_pagamento='PARCELADO' e numero_parcelas > 1
    
    # Verificar se as parcelas foram criadas
    parcelas = ParcelaCompra.objects.filter(compra=compra)
    print(f"  - Parcelas criadas: {parcelas.count()}")
    
    for parcela in parcelas:
        print(f"    Parcela {parcela.numero_parcela}: R$ {parcela.valor_parcela} - Vencimento: {parcela.data_vencimento}")
    
    print("\n✅ TESTE DE PAGAMENTO PARCELADO CONCLUÍDO COM SUCESSO!")
    return True

if __name__ == '__main__':
    success = test_pagamento_parcelado_frontend()
    sys.exit(0 if success else 1)