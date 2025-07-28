#!/usr/bin/env python
"""
Script para popular o banco de dados com dados de teste
Incluindo várias locações para testar o sistema
"""

import os
import sys
import django
from datetime import date, timedelta
from decimal import Decimal

# Adicionar o diretório backend ao path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.models import (
    Usuario, Obra, Funcionario, Equipe, 
    Locacao_Obras_Equipes
)

def create_test_data():
    print("Criando dados de teste...")
    
    # Criar usuários
    admin_user, created = Usuario.objects.get_or_create(
        login='admin_test',
        defaults={
            'password': 'pbkdf2_sha256$600000$test$hash',  # senha: test123
            'nome_completo': 'Administrador Teste',
            'nivel_acesso': 'admin',
            'is_staff': True,
            'is_superuser': True
        }
    )
    if created:
        admin_user.set_password('test123')
        admin_user.save()
        print(f"✓ Usuário admin criado: {admin_user.login}")
    
    gerente_user, created = Usuario.objects.get_or_create(
        login='gerente_test',
        defaults={
            'password': 'pbkdf2_sha256$600000$test$hash',
            'nome_completo': 'Gerente Teste',
            'nivel_acesso': 'gerente',
            'is_staff': True
        }
    )
    if created:
        gerente_user.set_password('test123')
        gerente_user.save()
        print(f"✓ Usuário gerente criado: {gerente_user.login}")
    
    # Criar obras
    obras_data = [
        {'nome_obra': 'Construção Residencial Alpha', 'cidade': 'São Paulo', 'endereco_completo': 'Rua das Flores, 123 - Vila Madalena'},
        {'nome_obra': 'Edifício Comercial Beta', 'cidade': 'Rio de Janeiro', 'endereco_completo': 'Av. Atlântica, 456 - Copacabana'},
        {'nome_obra': 'Shopping Center Gamma', 'cidade': 'Belo Horizonte', 'endereco_completo': 'Rua do Comércio, 789 - Centro'},
        {'nome_obra': 'Condomínio Delta', 'cidade': 'Brasília', 'endereco_completo': 'Quadra 15, Lote 10 - Asa Norte'},
        {'nome_obra': 'Reforma Hospital Epsilon', 'cidade': 'Salvador', 'endereco_completo': 'Av. Principal, 321 - Barra'}
    ]
    
    obras = []
    for obra_data in obras_data:
        obra, created = Obra.objects.get_or_create(
            nome_obra=obra_data['nome_obra'],
            defaults={
                'status': 'Em Andamento',
                'cidade': obra_data['cidade'],
                'endereco_completo': obra_data['endereco_completo']
            }
        )
        obras.append(obra)
        if created:
            print(f"✓ Obra criada: {obra.nome_obra}")
    
    # Criar funcionários
    funcionarios_data = [
        {'nome_completo': 'João Silva Santos', 'cargo': 'Pedreiro', 'valor_diaria': '150.00'},
        {'nome_completo': 'Maria Oliveira Costa', 'cargo': 'Eletricista', 'valor_diaria': '180.00'},
        {'nome_completo': 'Carlos Eduardo Lima', 'cargo': 'Encanador', 'valor_diaria': '160.00'},
        {'nome_completo': 'Ana Paula Ferreira', 'cargo': 'Pintora', 'valor_diaria': '140.00'},
        {'nome_completo': 'Roberto Almeida', 'cargo': 'Carpinteiro', 'valor_diaria': '170.00'},
        {'nome_completo': 'Fernanda Souza', 'cargo': 'Azulejista', 'valor_diaria': '165.00'},
        {'nome_completo': 'Pedro Henrique', 'cargo': 'Soldador', 'valor_diaria': '190.00'},
        {'nome_completo': 'Juliana Martins', 'cargo': 'Gesseira', 'valor_diaria': '155.00'}
    ]
    
    funcionarios = []
    for func_data in funcionarios_data:
        funcionario, created = Funcionario.objects.get_or_create(
            nome_completo=func_data['nome_completo'],
            defaults={
                'cargo': func_data['cargo'],
                'data_contratacao': date(2023, 1, 15),
                'valor_diaria_padrao': Decimal(func_data['valor_diaria'])
            }
        )
        funcionarios.append(funcionario)
        if created:
            print(f"✓ Funcionário criado: {funcionario.nome_completo} - {funcionario.cargo}")
    
    # Criar equipes
    equipes_data = [
        {'nome_equipe': 'Equipe Estrutural'},
        {'nome_equipe': 'Equipe Elétrica'},
        {'nome_equipe': 'Equipe Hidráulica'},
        {'nome_equipe': 'Equipe Acabamento'},
        {'nome_equipe': 'Equipe Paisagismo'}
    ]
    
    equipes = []
    for equipe_data in equipes_data:
        equipe, created = Equipe.objects.get_or_create(
            nome_equipe=equipe_data['nome_equipe']
        )
        equipes.append(equipe)
        if created:
            print(f"✓ Equipe criada: {equipe.nome_equipe}")
    
    # Criar locações variadas para teste
    print("\nCriando locações de teste...")
    
    # Data base para as locações (semana atual)
    hoje = date.today()
    inicio_semana = hoje - timedelta(days=hoje.weekday())  # Segunda-feira
    
    locacoes_data = [
        # Locações da semana atual
        {
            'obra': obras[0],
            'funcionario_locado': funcionarios[0],  # João Silva
            'data_inicio': inicio_semana,
            'data_fim': inicio_semana,
            'valor': '150.00',
            'observacoes': 'Construção de alicerce'
        },
        {
            'obra': obras[0],
            'equipe': equipes[0],  # Equipe Estrutural
            'data_inicio': inicio_semana + timedelta(days=1),
            'data_fim': inicio_semana + timedelta(days=2),
            'valor': '800.00',
            'observacoes': 'Montagem de estrutura'
        },
        {
            'obra': obras[1],
            'servico_externo': 'Consultoria Arquitetônica Especializada',
            'data_inicio': inicio_semana + timedelta(days=2),
            'data_fim': inicio_semana + timedelta(days=4),
            'valor': '1200.00',
            'observacoes': 'Análise estrutural do projeto'
        },
        {
            'obra': obras[1],
            'funcionario_locado': funcionarios[1],  # Maria Oliveira
            'data_inicio': inicio_semana + timedelta(days=3),
            'data_fim': inicio_semana + timedelta(days=3),
            'valor': '180.00',
            'observacoes': 'Instalação elétrica'
        },
        {
            'obra': obras[2],
            'equipe': equipes[1],  # Equipe Elétrica
            'data_inicio': inicio_semana + timedelta(days=4),
            'data_fim': inicio_semana + timedelta(days=6),
            'valor': '1500.00',
            'observacoes': 'Sistema elétrico completo'
        },
        
        # Locações da semana passada
        {
            'obra': obras[0],
            'funcionario_locado': funcionarios[2],  # Carlos Eduardo
            'data_inicio': inicio_semana - timedelta(days=7),
            'data_fim': inicio_semana - timedelta(days=5),
            'valor': '480.00',
            'observacoes': 'Instalação hidráulica'
        },
        {
            'obra': obras[2],
            'servico_externo': 'Terraplanagem e Escavação',
            'data_inicio': inicio_semana - timedelta(days=6),
            'data_fim': inicio_semana - timedelta(days=4),
            'valor': '2500.00',
            'observacoes': 'Preparação do terreno'
        },
        {
            'obra': obras[3],
            'funcionario_locado': funcionarios[3],  # Ana Paula
            'data_inicio': inicio_semana - timedelta(days=3),
            'data_fim': inicio_semana - timedelta(days=1),
            'valor': '420.00',
            'observacoes': 'Pintura de fachada'
        },
        
        # Locações da próxima semana
        {
            'obra': obras[3],
            'equipe': equipes[2],  # Equipe Hidráulica
            'data_inicio': inicio_semana + timedelta(days=7),
            'data_fim': inicio_semana + timedelta(days=9),
            'valor': '900.00',
            'observacoes': 'Sistema hidráulico'
        },
        {
            'obra': obras[4],
            'funcionario_locado': funcionarios[4],  # Roberto Almeida
            'data_inicio': inicio_semana + timedelta(days=8),
            'data_fim': inicio_semana + timedelta(days=12),
            'valor': '850.00',
            'observacoes': 'Estrutura de madeira'
        },
        {
            'obra': obras[4],
            'servico_externo': 'Impermeabilização Especializada',
            'data_inicio': inicio_semana + timedelta(days=10),
            'data_fim': inicio_semana + timedelta(days=11),
            'valor': '800.00',
            'observacoes': 'Impermeabilização de laje'
        },
        
        # Locações de longo prazo (multi-dia)
        {
            'obra': obras[1],
            'funcionario_locado': funcionarios[5],  # Fernanda Souza
            'data_inicio': inicio_semana + timedelta(days=14),
            'data_fim': inicio_semana + timedelta(days=18),
            'valor': '825.00',
            'observacoes': 'Revestimento cerâmico'
        },
        {
            'obra': obras[2],
            'equipe': equipes[3],  # Equipe Acabamento
            'data_inicio': inicio_semana + timedelta(days=15),
            'data_fim': inicio_semana + timedelta(days=20),
            'valor': '2400.00',
            'observacoes': 'Acabamento completo'
        },
        {
            'obra': obras[0],
            'servico_externo': 'Instalação de Elevadores',
            'data_inicio': inicio_semana + timedelta(days=21),
            'data_fim': inicio_semana + timedelta(days=25),
            'valor': '15000.00',
            'observacoes': 'Instalação de 2 elevadores'
        }
    ]
    
    locacoes_criadas = 0
    for loc_data in locacoes_data:
        # Verificar se já existe uma locação similar
        existing = Locacao_Obras_Equipes.objects.filter(
            obra=loc_data['obra'],
            data_locacao_inicio=loc_data['data_inicio'],
            data_locacao_fim=loc_data['data_fim']
        )
        
        if loc_data.get('funcionario_locado'):
            existing = existing.filter(funcionario_locado=loc_data['funcionario_locado'])
        elif loc_data.get('equipe'):
            existing = existing.filter(equipe=loc_data['equipe'])
        elif loc_data.get('servico_externo'):
            existing = existing.filter(servico_externo=loc_data['servico_externo'])
        
        if not existing.exists():
            locacao = Locacao_Obras_Equipes.objects.create(
                obra=loc_data['obra'],
                funcionario_locado=loc_data.get('funcionario_locado'),
                equipe=loc_data.get('equipe'),
                servico_externo=loc_data.get('servico_externo'),
                data_locacao_inicio=loc_data['data_inicio'],
                data_locacao_fim=loc_data['data_fim'],
                valor_pagamento=Decimal(loc_data['valor']),
                observacoes=loc_data['observacoes'],
                status_locacao='ativa'
            )
            locacoes_criadas += 1
            
            # Determinar tipo de recurso para log
            if locacao.funcionario_locado:
                tipo_recurso = f"Funcionário: {locacao.funcionario_locado.nome_completo}"
            elif locacao.equipe:
                tipo_recurso = f"Equipe: {locacao.equipe.nome_equipe}"
            else:
                tipo_recurso = f"Serviço: {locacao.servico_externo}"
            
            print(f"✓ Locação criada: {tipo_recurso} - {loc_data['obra'].nome_obra} ({loc_data['data_inicio']} a {loc_data['data_fim']})")
    
    print(f"\n✅ Script concluído!")
    print(f"📊 Resumo:")
    print(f"   - {len(obras)} obras")
    print(f"   - {len(funcionarios)} funcionários")
    print(f"   - {len(equipes)} equipes")
    print(f"   - {locacoes_criadas} locações criadas")
    print(f"\n🔑 Usuários de teste:")
    print(f"   - admin_test / test123 (Administrador)")
    print(f"   - gerente_test / test123 (Gerente)")
    print(f"\n💡 Dica: Use o planejamento semanal para visualizar as locações!")

if __name__ == '__main__':
    try:
        create_test_data()
    except Exception as e:
        print(f"❌ Erro ao executar script: {e}")
        import traceback
        traceback.print_exc()