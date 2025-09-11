from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from core.models import (
    Obra, Funcionario, Equipe, Material, Locacao_Obras_Equipes, Compra, ItemCompra, Despesa_Extra
)

class Command(BaseCommand):
    help = 'Populate database with comprehensive test data'

    def handle(self, *args, **options):
        self.stdout.write('Starting database population with comprehensive test data...')
        
        # Clear existing data
        self.stdout.write('Clearing existing data...')
        Despesa_Extra.objects.all().delete()
        ItemCompra.objects.all().delete()
        Compra.objects.all().delete()
        Locacao_Obras_Equipes.objects.all().delete()
        Material.objects.all().delete()
        Equipe.objects.all().delete()
        Funcionario.objects.all().delete()
        Obra.objects.all().delete()
        
        # Get current date for realistic data
        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday())
        
        # Create Obras with varied status and characteristics
        self.stdout.write('Creating Obras with varied characteristics...')
        obras = []
        
        obra1 = Obra.objects.create(
            nome_obra='Residencial Vila Verde',
            endereco_completo='Rua das Palmeiras, 123 - Jardim Botânico',
            cidade='São Paulo',
            data_inicio=start_of_week - timedelta(days=30),
            data_prevista_fim=start_of_week + timedelta(days=60),
            status='Em Andamento',
            cliente_nome='João da Silva',
            orcamento_previsto=Decimal('250000.00')
        )
        obras.append(obra1)
        
        obra2 = Obra.objects.create(
            nome_obra='Edifício Comercial Centro',
            endereco_completo='Av. Principal, 456 - Centro',
            cidade='São Paulo',
            data_inicio=start_of_week - timedelta(days=45),
            data_prevista_fim=start_of_week + timedelta(days=90),
            status='Em Andamento',
            cliente_nome='Empresa ABC Ltda',
            orcamento_previsto=Decimal('850000.00')
        )
        obras.append(obra2)
        
        obra3 = Obra.objects.create(
            nome_obra='Reforma Apartamento Luxo',
            endereco_completo='Rua Elegante, 789 - Bairro Nobre',
            cidade='São Paulo',
            data_inicio=start_of_week - timedelta(days=15),
            data_prevista_fim=start_of_week + timedelta(days=45),
            status='Em Andamento',
            cliente_nome='Maria Santos',
            orcamento_previsto=Decimal('120000.00')
        )
        obras.append(obra3)
        
        obra4 = Obra.objects.create(
            nome_obra='Galpão Industrial Norte',
            endereco_completo='Rodovia Industrial, Km 15 - Distrito Industrial',
            cidade='Guarulhos',
            data_inicio=start_of_week - timedelta(days=60),
            data_prevista_fim=start_of_week + timedelta(days=30),
            status='Em Andamento',
            cliente_nome='Indústria XYZ S.A.',
            orcamento_previsto=Decimal('450000.00')
        )
        obras.append(obra4)
        
        obra5 = Obra.objects.create(
            nome_obra='Casa de Campo Moderna',
            endereco_completo='Estrada Rural, s/n - Zona Rural',
            cidade='Atibaia',
            data_inicio=start_of_week - timedelta(days=20),
            data_prevista_fim=start_of_week + timedelta(days=70),
            status='Planejada',
            cliente_nome='Carlos Mendes',
            orcamento_previsto=Decimal('320000.00')
        )
        obras.append(obra5)
        
        # Adicionar mais 10 obras para ter dados suficientes
        for i in range(6, 16):
            obra = Obra.objects.create(
                nome_obra=f'Projeto {i} - Construção Variada',
                endereco_completo=f'Endereço {i}, {100+i*10} - Bairro {i}',
                cidade='São Paulo',
                data_inicio=start_of_week - timedelta(days=i*5),
                data_prevista_fim=start_of_week + timedelta(days=30+i*10),
                status='Em Andamento' if i % 2 == 0 else 'Planejada',
                cliente_nome=f'Cliente {i}',
                orcamento_previsto=Decimal(f'{50000 + i*10000}.00')
            )
            obras.append(obra)
        
        self.stdout.write(self.style.SUCCESS(f'{len(obras)} Obras created with varied characteristics.'))
        
        # Create Funcionarios with different roles and daily rates
        self.stdout.write('Creating Funcionarios with varied roles and rates...')
        funcionarios = []
        
        funcionario1 = Funcionario.objects.create(
            nome_completo='João Silva Santos',
            cargo='Pedreiro',
            data_contratacao=start_of_week - timedelta(days=200),
            valor_diaria_padrao=Decimal('180.00')
        )
        funcionarios.append(funcionario1)
        
        funcionario2 = Funcionario.objects.create(
            nome_completo='Maria Oliveira Costa',
            cargo='Eletricista',
            data_contratacao=start_of_week - timedelta(days=180),
            valor_diaria_padrao=Decimal('220.00')
        )
        funcionarios.append(funcionario2)
        
        funcionario3 = Funcionario.objects.create(
            nome_completo='Carlos Eduardo Lima',
            cargo='Encanador',
            data_contratacao=start_of_week - timedelta(days=150),
            valor_diaria_padrao=Decimal('200.00')
        )
        funcionarios.append(funcionario3)
        
        funcionario4 = Funcionario.objects.create(
            nome_completo='Ana Paula Ferreira',
            cargo='Pintora',
            data_contratacao=start_of_week - timedelta(days=120),
            valor_diaria_padrao=Decimal('150.00')
        )
        funcionarios.append(funcionario4)
        
        funcionario5 = Funcionario.objects.create(
            nome_completo='Roberto Machado',
            cargo='Carpinteiro',
            data_contratacao=start_of_week - timedelta(days=100),
            valor_diaria_padrao=Decimal('190.00')
        )
        funcionarios.append(funcionario5)
        
        funcionario6 = Funcionario.objects.create(
            nome_completo='Fernanda Souza',
            cargo='Azulejista',
            data_contratacao=start_of_week - timedelta(days=80),
            valor_diaria_padrao=Decimal('170.00')
        )
        funcionarios.append(funcionario6)
        
        funcionario7 = Funcionario.objects.create(
            nome_completo='Paulo Henrique',
            cargo='Soldador',
            data_contratacao=start_of_week - timedelta(days=60),
            valor_diaria_padrao=Decimal('250.00')
        )
        funcionarios.append(funcionario7)
        
        funcionario8 = Funcionario.objects.create(
            nome_completo='Luciana Martins',
            cargo='Gesseiro',
            data_contratacao=start_of_week - timedelta(days=40),
            valor_diaria_padrao=Decimal('160.00')
        )
        funcionarios.append(funcionario8)
        
        self.stdout.write(self.style.SUCCESS(f'{len(funcionarios)} Funcionários created with varied roles.'))
        
        # Create Equipes with different compositions
        self.stdout.write('Creating Equipes with varied compositions...')
        equipes = []
        
        equipe1 = Equipe.objects.create(
            nome_equipe='Equipe Alvenaria Premium',
            descricao='Equipe especializada em alvenaria estrutural e acabamentos - 3 pedreiros + 2 serventes + ferramentas',
            lider=funcionario1
        )
        equipes.append(equipe1)
        
        equipe2 = Equipe.objects.create(
            nome_equipe='Equipe Elétrica Industrial',
            descricao='Equipe para instalações elétricas industriais - 2 eletricistas + 1 auxiliar + equipamentos',
            lider=funcionario2
        )
        equipes.append(equipe2)
        
        equipe3 = Equipe.objects.create(
            nome_equipe='Equipe Hidráulica Completa',
            descricao='Equipe para sistemas hidráulicos complexos - 2 encanadores + 1 auxiliar + ferramentas especiais',
            lider=funcionario3
        )
        equipes.append(equipe3)
        
        equipe4 = Equipe.objects.create(
            nome_equipe='Equipe Acabamento Fino',
            descricao='Equipe para acabamentos de alto padrão - 1 pintor + 1 azulejista + 1 gesseiro',
            lider=funcionario4
        )
        equipes.append(equipe4)
        
        equipe5 = Equipe.objects.create(
            nome_equipe='Equipe Estrutural Metálica',
            descricao='Equipe especializada em estruturas metálicas - 2 soldadores + 1 montador + equipamentos de solda',
            lider=funcionario5
        )
        equipes.append(equipe5)
        
        self.stdout.write(self.style.SUCCESS(f'{len(equipes)} Equipes created with varied compositions.'))
        
        # Create Materials with different categories
        self.stdout.write('Creating Materials with varied categories...')
        materiais = []
        
        # Materiais básicos de construção
        material1 = Material.objects.create(
            nome='Cimento Portland CP-II - Saco de 50kg - alta resistência',
            unidade_medida='saco',
            categoria_uso_padrao='ESTRUTURAL'
        )
        materiais.append(material1)
        
        material2 = Material.objects.create(
            nome='Areia Média Lavada - para concreto e argamassa',
            unidade_medida='m³',
            categoria_uso_padrao='ESTRUTURAL'
        )
        materiais.append(material2)
        
        material3 = Material.objects.create(
            nome='Brita 1 Granito - para concreto estrutural',
            unidade_medida='m³',
            categoria_uso_padrao='ESTRUTURAL'
        )
        materiais.append(material3)
        
        material4 = Material.objects.create(
            nome='Tijolo Cerâmico 6 Furos - estrutural 14x19x29cm',
            unidade_medida='un',
            categoria_uso_padrao='ESTRUTURAL'
        )
        materiais.append(material4)
        
        material5 = Material.objects.create(
            nome='Bloco de Concreto 14x19x39 - estrutural para vedação',
            unidade_medida='un',
            categoria_uso_padrao='ESTRUTURAL'
        )
        materiais.append(material5)
        
        # Materiais elétricos
        material6 = Material.objects.create(
            nome='Fio Elétrico 2,5mm² Flexível - cobre para instalações residenciais',
            unidade_medida='m²',
            categoria_uso_padrao='ELETRICO'
        )
        materiais.append(material6)
        
        material7 = Material.objects.create(
            nome='Disjuntor Bipolar 25A - proteção para circuitos de chuveiro',
            unidade_medida='un',
            categoria_uso_padrao='ELETRICO'
        )
        materiais.append(material7)
        
        material8 = Material.objects.create(
            nome='Tomada 2P+T 10A Branca - padrão brasileiro',
            unidade_medida='un',
            categoria_uso_padrao='ELETRICO'
        )
        materiais.append(material8)
        
        # Materiais hidráulicos
        material9 = Material.objects.create(
            nome='Tubo PVC 100mm Esgoto - para sistema de esgoto',
            unidade_medida='m²',
            categoria_uso_padrao='HIDRAULICO'
        )
        materiais.append(material9)
        
        material10 = Material.objects.create(
            nome='Registro Esfera 1/2" Bronze - para água fria',
            unidade_medida='un',
            categoria_uso_padrao='HIDRAULICO'
        )
        materiais.append(material10)
        
        material11 = Material.objects.create(
            nome='Caixa D\'Água 1000L Polietileno - reservatório com tampa',
            unidade_medida='un',
            categoria_uso_padrao='HIDRAULICO'
        )
        materiais.append(material11)
        
        # Materiais de acabamento
        material12 = Material.objects.create(
            nome='Cerâmica 45x45 Retificada - porcelanato para piso',
            unidade_medida='m²',
            categoria_uso_padrao='ACABAMENTO'
        )
        materiais.append(material12)
        
        material13 = Material.objects.create(
            nome='Azulejo 30x40 Branco - revestimento para banheiro',
            unidade_medida='m²',
            categoria_uso_padrao='ACABAMENTO'
        )
        materiais.append(material13)
        
        material14 = Material.objects.create(
            nome='Tinta Acrílica Branca 18L - para paredes internas',
            unidade_medida='un',
            categoria_uso_padrao='ACABAMENTO'
        )
        materiais.append(material14)
        
        material15 = Material.objects.create(
            nome='Massa Corrida PVA 25kg - preparação de paredes',
            unidade_medida='saco',
            categoria_uso_padrao='ACABAMENTO'
        )
        materiais.append(material15)
        
        # Materiais de carpintaria
        material16 = Material.objects.create(
            nome='Madeira Pinus 2x4" Tratada - para estrutura',
            unidade_medida='m²',
            categoria_uso_padrao='ESTRUTURAL'
        )
        materiais.append(material16)
        
        material17 = Material.objects.create(
            nome='Compensado Naval 15mm - chapa 2,20x1,60m',
            unidade_medida='un',
            categoria_uso_padrao='ESTRUTURAL'
        )
        materiais.append(material17)
        
        material18 = Material.objects.create(
            nome='Dobradiça 3" Aço Inox - para portas',
            unidade_medida='un',
            categoria_uso_padrao='ACABAMENTO'
        )
        materiais.append(material18)
        
        # Materiais diversos
        material19 = Material.objects.create(
            nome='Argamassa Colante AC-I - saco 20kg para cerâmica',
            unidade_medida='saco',
            categoria_uso_padrao='ACABAMENTO'
        )
        materiais.append(material19)
        
        material20 = Material.objects.create(
            nome='Rejunte Flexível Cinza - para cerâmica',
            unidade_medida='kg',
            categoria_uso_padrao='ACABAMENTO'
        )
        materiais.append(material20)
        
        # Adicionar mais 10 materiais para completar
        for i in range(21, 31):
            material = Material.objects.create(
                nome=f'Material Especial {i} - para uso específico',
                unidade_medida='un' if i % 2 == 0 else 'm²',
                categoria_uso_padrao='GERAL'
            )
            materiais.append(material)
        
        self.stdout.write(self.style.SUCCESS(f'{len(materiais)} Materiais created with varied categories.'))
        
        # Create Locações with multiple days and individual payments
        self.stdout.write('Creating Locações with multiple days and individual payments...')
        locacoes_created = []
        
        # Locação de funcionário para 3 dias consecutivos
        for i in range(3):
            data_locacao = start_of_week + timedelta(days=i)
            locacao = Locacao_Obras_Equipes.objects.create(
                obra=obras[0],
                funcionario_locado=funcionarios[0],
                data_locacao_inicio=data_locacao,
                data_locacao_fim=data_locacao,
                data_pagamento=data_locacao + timedelta(days=7),  # Pagamento em 7 dias
                observacoes=f'Dia {i+1} de 3 - Alvenaria estrutural'
            )
            locacoes_created.append(locacao)
        
        # Locação de equipe para 5 dias com pagamentos variados
        for i in range(5):
            data_locacao = start_of_week + timedelta(days=i+1)
            dias_para_pagamento = 5 if i < 3 else 10  # Primeiros 3 dias pagos em 5 dias, últimos 2 em 10
            locacao = Locacao_Obras_Equipes.objects.create(
                obra=obras[1],
                equipe=equipes[0],
                data_locacao_inicio=data_locacao,
                data_locacao_fim=data_locacao,
                data_pagamento=data_locacao + timedelta(days=dias_para_pagamento),
                observacoes=f'Dia {i+1} de 5 - Equipe alvenaria premium'
            )
            locacoes_created.append(locacao)
        
        # Locação de funcionário para 2 dias não consecutivos
        locacao1 = Locacao_Obras_Equipes.objects.create(
            obra=obras[2],
            funcionario_locado=funcionarios[1],
            data_locacao_inicio=start_of_week + timedelta(days=2),
            data_locacao_fim=start_of_week + timedelta(days=2),
            data_pagamento=start_of_week + timedelta(days=9),
            observacoes='Instalação elétrica - Dia 1'
        )
        locacoes_created.append(locacao1)
        
        locacao2 = Locacao_Obras_Equipes.objects.create(
            obra=obras[2],
            funcionario_locado=funcionarios[1],
            data_locacao_inicio=start_of_week + timedelta(days=4),
            data_locacao_fim=start_of_week + timedelta(days=4),
            data_pagamento=start_of_week + timedelta(days=11),
            observacoes='Instalação elétrica - Dia 2'
        )
        locacoes_created.append(locacao2)
        
        # Locação de equipe para 4 dias com pagamentos em datas diferentes
        for i in range(4):
            data_locacao = start_of_week + timedelta(days=i+3)
            locacao = Locacao_Obras_Equipes.objects.create(
                obra=obras[3],
                equipe=equipes[1],
                data_locacao_inicio=data_locacao,
                data_locacao_fim=data_locacao,
                data_pagamento=data_locacao + timedelta(days=15),  # Pagamento em 15 dias
                observacoes=f'Dia {i+1} de 4 - Instalação elétrica industrial'
            )
            locacoes_created.append(locacao)
        
        # Mais locações variadas
        locacao3 = Locacao_Obras_Equipes.objects.create(
            obra=obras[4],
            funcionario_locado=funcionarios[2],
            data_locacao_inicio=start_of_week + timedelta(days=5),
            data_locacao_fim=start_of_week + timedelta(days=5),
            data_pagamento=start_of_week + timedelta(days=12),
            observacoes='Instalação hidráulica - Dia único'
        )
        locacoes_created.append(locacao3)
        
        # Locação de equipe para 6 dias
        for i in range(6):
            data_locacao = start_of_week + timedelta(days=i+7)
            locacao = Locacao_Obras_Equipes.objects.create(
                obra=obras[5],
                equipe=equipes[2],
                data_locacao_inicio=data_locacao,
                data_locacao_fim=data_locacao,
                data_pagamento=data_locacao + timedelta(days=20),
                observacoes=f'Dia {i+1} de 6 - Sistema hidráulico completo'
            )
            locacoes_created.append(locacao)
        
        self.stdout.write(self.style.SUCCESS(f'{len(locacoes_created)} Locações created with individual daily payments.'))
        
        # Create Compras with varied payment dates (no installments)
        self.stdout.write('Creating Compras with varied payment dates (no installments)...')
        compras_created = []
        
        # Compra 1 - Pagamento à vista
        data_compra1 = start_of_week - timedelta(days=5)
        compra1 = Compra.objects.create(
            obra=obras[0],
            fornecedor='Materiais de Construção Silva Ltda.',
            data_compra=data_compra1,
            forma_pagamento='a_vista',
            data_pagamento=data_compra1,  # Mesmo dia
            observacoes='Compra à vista com desconto'
        )
        ItemCompra.objects.create(
            compra=compra1,
            material=materiais[0],  # Cimento
            quantidade=Decimal('50.00'),
            valor_unitario=Decimal('32.50'),
            categoria_uso='Estrutura'
        )
        ItemCompra.objects.create(
            compra=compra1,
            material=materiais[1],  # Areia
            quantidade=Decimal('10.00'),
            valor_unitario=Decimal('85.00'),
            categoria_uso='Estrutura'
        )
        compras_created.append(compra1)
        
        # Compra 2 - Pagamento em 15 dias
        data_compra2 = start_of_week - timedelta(days=8)
        compra2 = Compra.objects.create(
            obra=obras[1],
            fornecedor='Elétrica Industrial Ltda.',
            data_compra=data_compra2,
            forma_pagamento='prazo',
            data_pagamento=data_compra2 + timedelta(days=15),
            observacoes='Material elétrico - Pagamento em 15 dias'
        )
        ItemCompra.objects.create(
            compra=compra2,
            material=materiais[5],  # Fio elétrico
            quantidade=Decimal('500.00'),
            valor_unitario=Decimal('8.50'),
            categoria_uso='Instalação'
        )
        ItemCompra.objects.create(
            compra=compra2,
            material=materiais[6],  # Disjuntor
            quantidade=Decimal('12.00'),
            valor_unitario=Decimal('45.00'),
            categoria_uso='Instalação'
        )
        compras_created.append(compra2)
        
        # Compra 3 - Pagamento em 30 dias
        data_compra3 = start_of_week - timedelta(days=12)
        compra3 = Compra.objects.create(
            obra=obras[2],
            fornecedor='Hidráulica Premium S.A.',
            data_compra=data_compra3,
            forma_pagamento='prazo',
            data_pagamento=data_compra3 + timedelta(days=30),
            observacoes='Material hidráulico - Pagamento em 30 dias'
        )
        ItemCompra.objects.create(
            compra=compra3,
            material=materiais[8],  # Tubo PVC
            quantidade=Decimal('100.00'),
            valor_unitario=Decimal('25.00'),
            categoria_uso='Instalação'
        )
        ItemCompra.objects.create(
            compra=compra3,
            material=materiais[10],  # Caixa d'água
            quantidade=Decimal('2.00'),
            valor_unitario=Decimal('380.00'),
            categoria_uso='Instalação'
        )
        compras_created.append(compra3)
        
        # Compra 4 - Pagamento em 7 dias
        data_compra4 = start_of_week - timedelta(days=3)
        compra4 = Compra.objects.create(
            obra=obras[3],
            fornecedor='Revestimentos e Acabamentos Ltda.',
            data_compra=data_compra4,
            forma_pagamento='prazo',
            data_pagamento=data_compra4 + timedelta(days=7),
            observacoes='Cerâmica e azulejos - Pagamento em 7 dias'
        )
        ItemCompra.objects.create(
            compra=compra4,
            material=materiais[11],  # Cerâmica
            quantidade=Decimal('80.00'),
            valor_unitario=Decimal('45.00'),
            categoria_uso='Acabamento'
        )
        ItemCompra.objects.create(
            compra=compra4,
            material=materiais[12],  # Azulejo
            quantidade=Decimal('35.00'),
            valor_unitario=Decimal('28.00'),
            categoria_uso='Acabamento'
        )
        compras_created.append(compra4)
        
        # Compra 5 - Pagamento em 45 dias
        data_compra5 = start_of_week - timedelta(days=20)
        compra5 = Compra.objects.create(
            obra=obras[4],
            fornecedor='Madeireira São Paulo Ltda.',
            data_compra=data_compra5,
            forma_pagamento='prazo',
            data_pagamento=data_compra5 + timedelta(days=45),
            observacoes='Madeira tratada - Pagamento em 45 dias'
        )
        ItemCompra.objects.create(
            compra=compra5,
            material=materiais[15],  # Madeira Pinus
            quantidade=Decimal('200.00'),
            valor_unitario=Decimal('18.50'),
            categoria_uso='Estrutura'
        )
        ItemCompra.objects.create(
            compra=compra5,
            material=materiais[16],  # Compensado
            quantidade=Decimal('15.00'),
            valor_unitario=Decimal('95.00'),
            categoria_uso='Acabamento'
        )
        compras_created.append(compra5)
        
        # Compra 6 - Pagamento em 21 dias
        data_compra6 = start_of_week - timedelta(days=7)
        compra6 = Compra.objects.create(
            obra=obras[5],
            fornecedor='Tintas e Vernizes Premium',
            data_compra=data_compra6,
            forma_pagamento='prazo',
            data_pagamento=data_compra6 + timedelta(days=21),
            observacoes='Material de pintura - Pagamento em 21 dias'
        )
        ItemCompra.objects.create(
            compra=compra6,
            material=materiais[13],  # Tinta acrílica
            quantidade=Decimal('8.00'),
            valor_unitario=Decimal('125.00'),
            categoria_uso='Acabamento'
        )
        compras_created.append(compra6)
        
        # Compra 7 - Pagamento em 60 dias
        data_compra7 = start_of_week - timedelta(days=25)
        compra7 = Compra.objects.create(
            obra=obras[6],
            fornecedor='Agregados Mineração Ltda.',
            data_compra=data_compra7,
            forma_pagamento='prazo',
            data_pagamento=data_compra7 + timedelta(days=60),
            observacoes='Agregados para concreto - Pagamento em 60 dias'
        )
        ItemCompra.objects.create(
            compra=compra7,
            material=materiais[2],  # Brita
            quantidade=Decimal('25.00'),
            valor_unitario=Decimal('95.00'),
            categoria_uso='Estrutura'
        )
        compras_created.append(compra7)
        
        # Compra 8 - Pagamento em 10 dias
        data_compra8 = start_of_week - timedelta(days=2)
        compra8 = Compra.objects.create(
            obra=obras[7],
            fornecedor='Ferragens e Ferramentas S.A.',
            data_compra=data_compra8,
            forma_pagamento='prazo',
            data_pagamento=data_compra8 + timedelta(days=10),
            observacoes='Ferragens diversas - Pagamento em 10 dias'
        )
        ItemCompra.objects.create(
            compra=compra8,
            material=materiais[17],  # Dobradiça
            quantidade=Decimal('24.00'),
            valor_unitario=Decimal('15.50'),
            categoria_uso='Acabamento'
        )
        compras_created.append(compra8)
        
        # Compra 9 - Pagamento em 35 dias
        data_compra9 = start_of_week - timedelta(days=18)
        compra9 = Compra.objects.create(
            obra=obras[8],
            fornecedor='Argamassas Técnicas Ltda.',
            data_compra=data_compra9,
            forma_pagamento='prazo',
            data_pagamento=data_compra9 + timedelta(days=35),
            observacoes='Argamassas especiais - Pagamento em 35 dias'
        )
        ItemCompra.objects.create(
            compra=compra9,
            material=materiais[18],  # Argamassa colante
            quantidade=Decimal('40.00'),
            valor_unitario=Decimal('28.00'),
            categoria_uso='Acabamento'
        )
        compras_created.append(compra9)
        
        # Compra 10 - Pagamento em 14 dias
        data_compra10 = start_of_week - timedelta(days=4)
        compra10 = Compra.objects.create(
            obra=obras[9],
            fornecedor='Blocos e Tijolos Cerâmicos',
            data_compra=data_compra10,
            forma_pagamento='prazo',
            data_pagamento=data_compra10 + timedelta(days=14),
            observacoes='Material de alvenaria - Pagamento em 14 dias'
        )
        ItemCompra.objects.create(
            compra=compra10,
            material=materiais[3],  # Tijolo cerâmico
            quantidade=Decimal('5.00'),
            valor_unitario=Decimal('850.00'),
            categoria_uso='Estrutura'
        )
        compras_created.append(compra10)
        
        # Compra 11 - Pagamento em 28 dias
        data_compra11 = start_of_week - timedelta(days=14)
        compra11 = Compra.objects.create(
            obra=obras[10],
            fornecedor='Rejuntes e Acabamentos Finos',
            data_compra=data_compra11,
            forma_pagamento='prazo',
            data_pagamento=data_compra11 + timedelta(days=28),
            observacoes='Rejuntes especiais - Pagamento em 28 dias'
        )
        ItemCompra.objects.create(
            compra=compra11,
            material=materiais[19],  # Rejunte flexível
            quantidade=Decimal('25.00'),
            valor_unitario=Decimal('42.00'),
            categoria_uso='Acabamento'
        )
        compras_created.append(compra11)
        
        # Compra 12 - Pagamento em 50 dias
        data_compra12 = start_of_week - timedelta(days=10)
        compra12 = Compra.objects.create(
            obra=obras[11],
            fornecedor='Equipamentos Pesados S.A.',
            data_compra=data_compra12,
            forma_pagamento='prazo',
            data_pagamento=data_compra12 + timedelta(days=50),
            observacoes='Equipamentos pesados - Pagamento em 50 dias'
        )
        ItemCompra.objects.create(
            compra=compra12,
            material=materiais[29],  # Andaime Metálico
            quantidade=Decimal('4.00'),
            valor_unitario=Decimal('1500.00'),
            categoria_uso='Equipamento'
        )
        compras_created.append(compra12)
        
        self.stdout.write(self.style.SUCCESS(f'{len(compras_created)} Compras created with varied payment dates (no installments).'))

        # Create Despesas Extras with varied dates and categories
        self.stdout.write('Creating Despesas Extras with varied categories...')
        despesas_created = []
        
        # Despesa 1 - Transporte
        despesa1 = Despesa_Extra.objects.create(
            obra=obras[0],
            descricao='Transporte de materiais - Caminhão - Frete de cimento e agregados',
            valor=Decimal('350.00'),
            data=start_of_week + timedelta(days=1),
            categoria='Transporte'
        )
        despesas_created.append(despesa1)
        
        # Despesa 2 - Alimentação
        despesa2 = Despesa_Extra.objects.create(
            obra=obras[1],
            descricao='Alimentação da equipe - Almoço para 8 funcionários',
            valor=Decimal('180.00'),
            data=start_of_week + timedelta(days=2),
            categoria='Alimentação'
        )
        despesas_created.append(despesa2)
        
        # Despesa 3 - Outros
        despesa3 = Despesa_Extra.objects.create(
            obra=obras[2],
            descricao='Combustível para equipamentos - Diesel para betoneira e gerador',
            valor=Decimal('420.00'),
            data=start_of_week + timedelta(days=3),
            categoria='Outros'
        )
        despesas_created.append(despesa3)
        
        # Despesa 4 - Ferramentas
        despesa4 = Despesa_Extra.objects.create(
            obra=obras[3],
            descricao='Manutenção de equipamentos - Reparo da furadeira industrial',
            valor=Decimal('280.00'),
            data=start_of_week + timedelta(days=4),
            categoria='Ferramentas'
        )
        despesas_created.append(despesa4)
        
        # Despesa 5 - Outros
        despesa5 = Despesa_Extra.objects.create(
            obra=obras[4],
            descricao='Equipamentos de segurança - Capacetes, luvas e cintos de segurança',
            valor=Decimal('650.00'),
            data=start_of_week + timedelta(days=5),
            categoria='Outros'
        )
        despesas_created.append(despesa5)
        
        # Despesa 6 - Outros
        despesa6 = Despesa_Extra.objects.create(
            obra=obras[5],
            descricao='Taxa de licença municipal - Alvará de construção',
            valor=Decimal('1200.00'),
            data=start_of_week + timedelta(days=6),
            categoria='Outros'
        )
        despesas_created.append(despesa6)
        
        # Despesa 7 - Outros
        despesa7 = Despesa_Extra.objects.create(
            obra=obras[6],
            descricao='Limpeza do canteiro - Remoção de entulho',
            valor=Decimal('150.00'),
            data=start_of_week + timedelta(days=7),
            categoria='Outros'
        )
        despesas_created.append(despesa7)
        
        # Despesa 8 - Outros
        despesa8 = Despesa_Extra.objects.create(
            obra=obras[7],
            descricao='Conta de energia elétrica - Consumo mensal do canteiro',
            valor=Decimal('380.00'),
            data=start_of_week + timedelta(days=8),
            categoria='Outros'
        )
        despesas_created.append(despesa8)
        
        # Despesa 9 - Outros
        despesa9 = Despesa_Extra.objects.create(
            obra=obras[8],
            descricao='Fornecimento de água - Caminhão pipa - 10.000 litros',
            valor=Decimal('220.00'),
            data=start_of_week + timedelta(days=9),
            categoria='Outros'
        )
        despesas_created.append(despesa9)
        
        # Despesa 10 - Outros
        despesa10 = Despesa_Extra.objects.create(
            obra=obras[9],
            descricao='Telefone e internet - Plano mensal do escritório',
            valor=Decimal('120.00'),
            data=start_of_week + timedelta(days=10),
            categoria='Outros'
        )
        despesas_created.append(despesa10)
        
        # Despesas adicionais com datas variadas
        # Despesa 11 - Outros
        despesa11 = Despesa_Extra.objects.create(
            obra=obras[10],
            descricao='Hospedagem de funcionários - Hotel para equipe externa - 4 diárias',
            valor=Decimal('800.00'),
            data=start_of_week - timedelta(days=3),
            categoria='Outros'
        )
        despesas_created.append(despesa11)
        
        # Despesa 12 - Outros
        despesa12 = Despesa_Extra.objects.create(
            obra=obras[11],
            descricao='Consultoria técnica especializada - Análise estrutural por engenheiro especialista',
            valor=Decimal('1500.00'),
            data=start_of_week - timedelta(days=7),
            categoria='Outros'
        )
        despesas_created.append(despesa12)
        
        # Despesa 13 - Outros
        despesa13 = Despesa_Extra.objects.create(
            obra=obras[12],
            descricao='Multa por atraso na entrega - Penalidade contratual',
            valor=Decimal('500.00'),
            data=start_of_week - timedelta(days=12),
            categoria='Outros'
        )
        despesas_created.append(despesa13)
        
        # Despesa 14 - Outros
        despesa14 = Despesa_Extra.objects.create(
            obra=obras[13],
            descricao='Seguro de equipamentos - Cobertura anual para maquinário',
            valor=Decimal('950.00'),
            data=start_of_week - timedelta(days=15),
            categoria='Outros'
        )
        despesas_created.append(despesa14)
        
        # Despesa 15 - Outros
        despesa15 = Despesa_Extra.objects.create(
            obra=obras[14],
            descricao='Materiais de escritório - Papelaria e material de escritório',
            valor=Decimal('85.00'),
            data=start_of_week + timedelta(days=11),
            categoria='Outros'
        )
        despesas_created.append(despesa15)
        
        self.stdout.write(self.style.SUCCESS(f'{len(despesas_created)} Despesas Extras created with varied categories.'))

        self.stdout.write(self.style.SUCCESS('Database successfully populated with comprehensive test data!'))
        self.stdout.write(self.style.SUCCESS(f'Summary: {len(obras)} Obras, {len(funcionarios)} Funcionários, {len(equipes)} Equipes, {len(materiais)} Materiais, {len(locacoes_created)} Locações, {len(compras_created)} Compras, {len(despesas_created)} Despesas Extras'))