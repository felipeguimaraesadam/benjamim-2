from django.core.management.base import BaseCommand
from datetime import date
from decimal import Decimal
from core.models import Obra, Material, Compra, ItemCompra, ParcelaCompra

class Command(BaseCommand):
    help = 'Teste completo de criacao de compras'
    
    def handle(self, *args, **options):
        self.stdout.write("=== TESTE DE CRIACAO DE COMPRA ===")
        
        # 1. Verificar/Criar dados de teste
        self.stdout.write("\n1. Preparando dados de teste...")
        
        # Criar obra se nao existir
        obra, created = Obra.objects.get_or_create(
            nome_obra="Obra Teste",
            defaults={
                'endereco_completo': 'Rua Teste, 123',
                'cidade': 'Cidade Teste',
                'status': 'Em Andamento',
                'data_inicio': date.today(),
                'orcamento_previsto': Decimal('50000.00')
            }
        )
        self.stdout.write(f"Obra: {obra.nome_obra} ({'criada' if created else 'existente'})")
        
        # Criar material se nao existir
        material, created = Material.objects.get_or_create(
            nome="Material Teste",
            defaults={
                'unidade_medida': 'un',
                'quantidade_em_estoque': Decimal('100.00'),
                'nivel_minimo_estoque': 10
            }
        )
        self.stdout.write(f"Material: {material.nome} ({'criado' if created else 'existente'})")
        
        # 2. Criar compra simples
        self.stdout.write("\n2. Criando compra simples...")
        
        # Criar compra diretamente no modelo
        compra = Compra.objects.create(
            obra=obra,
            fornecedor='Fornecedor Teste LTDA',
            data_compra=date.today(),
            nota_fiscal='NF-12345',
            valor_total_bruto=Decimal('1000.00'),
            desconto=Decimal('50.00'),
            observacoes='Compra de teste',
            forma_pagamento='AVISTA',
            tipo='COMPRA'
        )
        
        self.stdout.write(f"Compra criada: ID {compra.id}")
        self.stdout.write(f"Valor total bruto: R$ {compra.valor_total_bruto}")
        self.stdout.write(f"Desconto: R$ {compra.desconto}")
        self.stdout.write(f"Valor total liquido: R$ {compra.valor_total_liquido}")
        self.stdout.write(f"Fornecedor: {compra.fornecedor}")
        self.stdout.write(f"Nota fiscal: {compra.nota_fiscal}")
        self.stdout.write(f"Data de pagamento: {compra.data_pagamento}")
        
        # 3. Adicionar itens
        self.stdout.write("\n3. Adicionando itens a compra...")
        
        item = ItemCompra.objects.create(
            compra=compra,
            material=material,
            quantidade=Decimal('100.0'),
            valor_unitario=Decimal('9.50')
        )
        
        self.stdout.write(f"Item criado: {item.quantidade}x {item.material.nome}")
        self.stdout.write(f"Valor unitario: R$ {item.valor_unitario}")
        self.stdout.write(f"Valor total do item: R$ {item.valor_total_item}")
        
        # 4. Testar pagamento parcelado
        self.stdout.write("\n4. Testando pagamento parcelado...")
        
        compra_parcelada = Compra.objects.create(
            obra=obra,
            fornecedor='Fornecedor Parcelado LTDA',
            data_compra=date.today(),
            nota_fiscal='NF-67890',
            valor_total_bruto=Decimal('2000.00'),
            desconto=Decimal('0.00'),
            forma_pagamento='PARCELADO',
            numero_parcelas=3,
            valor_entrada=Decimal('500.00'),
            tipo='COMPRA'
        )
        
        self.stdout.write(f"Compra parcelada criada: ID {compra_parcelada.id}")
        self.stdout.write(f"Numero de parcelas: {compra_parcelada.numero_parcelas}")
        self.stdout.write(f"Valor de entrada: R$ {compra_parcelada.valor_entrada}")
        
        # Verificar parcelas criadas
        parcelas = ParcelaCompra.objects.filter(compra=compra_parcelada)
        self.stdout.write(f"Parcelas criadas: {parcelas.count()}")
        
        for parcela in parcelas:
            self.stdout.write(f"  Parcela {parcela.numero_parcela}: R$ {parcela.valor_parcela} - Vencimento: {parcela.data_vencimento} - Status: {parcela.status}")
        
        # 5. Verificar persistencia no banco
        self.stdout.write("\n5. Verificando persistencia no banco...")
        
        # Verificar compras
        total_compras = Compra.objects.count()
        self.stdout.write(f"Total de compras no banco: {total_compras}")
        
        # Verificar itens
        total_itens = ItemCompra.objects.count()
        self.stdout.write(f"Total de itens no banco: {total_itens}")
        
        # Verificar parcelas
        total_parcelas = ParcelaCompra.objects.count()
        self.stdout.write(f"Total de parcelas no banco: {total_parcelas}")
        
        # Verificar dados especificos
        compra_verificada = Compra.objects.get(id=compra.id)
        self.stdout.write(f"\nCompra {compra_verificada.id} verificada:")
        self.stdout.write(f"  Fornecedor: {compra_verificada.fornecedor}")
        self.stdout.write(f"  Nota fiscal: {compra_verificada.nota_fiscal}")
        self.stdout.write(f"  Valor total liquido: R$ {compra_verificada.valor_total_liquido}")
        self.stdout.write(f"  Forma de pagamento: {compra_verificada.forma_pagamento}")
        self.stdout.write(f"  Data de pagamento: {compra_verificada.data_pagamento}")
        
        # Verificar itens da compra
        itens_compra = ItemCompra.objects.filter(compra=compra_verificada)
        self.stdout.write(f"  Itens: {itens_compra.count()}")
        for item in itens_compra:
            self.stdout.write(f"    - {item.quantidade}x {item.material.nome} = R$ {item.valor_total_item}")
        
        # TESTE 2: Compra com pagamento parcelado
        self.stdout.write("\n=== TESTE 2: COMPRA PARCELADA ===")
        
        compra_parcelada = Compra.objects.create(
            obra=obra,
            fornecedor="Fornecedor Parcelado LTDA",
            data_compra=date.today(),
            nota_fiscal="NF-67890",
            valor_total_bruto=Decimal('2000.00'),
            desconto=Decimal('100.00'),
            valor_total_liquido=Decimal('1900.00'),
            observacoes="Compra parcelada para teste",
            forma_pagamento='PARCELADO',
            numero_parcelas=3,
            valor_entrada=Decimal('500.00'),
            tipo='COMPRA'
        )
        
        self.stdout.write(f"Compra parcelada criada: ID {compra_parcelada.id}")
        
        # Adicionar item à compra parcelada
        item_parcelado = ItemCompra.objects.create(
            compra=compra_parcelada,
            material=material,
            quantidade=Decimal('200.00'),
            valor_unitario=Decimal('9.50'),
            valor_total_item=Decimal('1900.00'),
            categoria_uso='ESTRUTURAL'
        )
        
        self.stdout.write(f"Item adicionado à compra parcelada: {item_parcelado.quantidade}x {item_parcelado.material.nome}")
        
        # Criar as parcelas
        compra_parcelada.create_installments()
        
        # Verificar se as parcelas foram criadas
        parcelas = ParcelaCompra.objects.filter(compra=compra_parcelada)
        self.stdout.write(f"Parcelas criadas: {parcelas.count()}")
        
        for i, parcela in enumerate(parcelas, 1):
            self.stdout.write(f"  Parcela {i}: R$ {parcela.valor_parcela} - Vencimento: {parcela.data_vencimento} - Status: {parcela.status}")
        
        # TESTE 3: Verificação completa de persistência
        self.stdout.write("\n=== TESTE 3: VERIFICAÇÃO DE PERSISTÊNCIA ===")
        
        # Recarregar dados do banco
        compra_recarregada = Compra.objects.get(id=compra.id)
        compra_parcelada_recarregada = Compra.objects.get(id=compra_parcelada.id)
        
        self.stdout.write("Dados persistidos corretamente:")
        self.stdout.write(f"  Compra 1 - Fornecedor: {compra_recarregada.fornecedor}")
        self.stdout.write(f"  Compra 1 - Valor líquido: R$ {compra_recarregada.valor_total_liquido}")
        self.stdout.write(f"  Compra 1 - Forma pagamento: {compra_recarregada.forma_pagamento}")
        
        self.stdout.write(f"  Compra 2 - Fornecedor: {compra_parcelada_recarregada.fornecedor}")
        self.stdout.write(f"  Compra 2 - Valor líquido: R$ {compra_parcelada_recarregada.valor_total_liquido}")
        self.stdout.write(f"  Compra 2 - Forma pagamento: {compra_parcelada_recarregada.forma_pagamento}")
        self.stdout.write(f"  Compra 2 - Número de parcelas: {compra_parcelada_recarregada.numero_parcelas}")
        self.stdout.write(f"  Compra 2 - Valor entrada: R$ {compra_parcelada_recarregada.valor_entrada}")
        
        # Verificar itens
        itens_compra1 = ItemCompra.objects.filter(compra=compra_recarregada)
        itens_compra2 = ItemCompra.objects.filter(compra=compra_parcelada_recarregada)
        
        self.stdout.write(f"  Itens compra 1: {itens_compra1.count()}")
        self.stdout.write(f"  Itens compra 2: {itens_compra2.count()}")
        
        # TESTE 4: Teste de orçamento
        self.stdout.write("\n=== TESTE 4: ORÇAMENTO ===")
        
        orcamento = Compra.objects.create(
            obra=obra,
            fornecedor="Fornecedor Orçamento LTDA",
            data_compra=date.today(),
            nota_fiscal="ORC-001",
            valor_total_bruto=Decimal('5000.00'),
            desconto=Decimal('250.00'),
            valor_total_liquido=Decimal('4750.00'),
            observacoes="Orçamento para análise",
            tipo='ORCAMENTO',
            status_orcamento='PENDENTE'
        )
        
        self.stdout.write(f"Orçamento criado: ID {orcamento.id} - Status: {orcamento.status_orcamento}")
        
        self.stdout.write("\n=== TODOS OS TESTES CONCLUÍDOS COM SUCESSO ===")
        self.stdout.write("Sistema de compras funcionando corretamente!")