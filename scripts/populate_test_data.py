#!/usr/bin/env python
"""
Script para popular o banco de dados com dados de teste, incluindo Obras,
Materiais, Compras e Locações para um teste mais completo.
"""

import os
import sys
import django
from datetime import date, timedelta
from decimal import Decimal
import random

# Adicionar o diretório backend ao path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

# Importar modelos após a configuração do Django
from core.models import (
    Usuario, Obra, Funcionario, Equipe, 
    Material, Compra, Locacao_Obras_Equipes
)

def get_or_create_with_log(model, defaults=None, **kwargs):
    """Helper para criar ou obter um objeto com logging."""
    obj, created = model.objects.get_or_create(defaults=defaults or {}, **kwargs)
    if created:
        print(f"✓ [CRIADO] {model.__name__}: {obj}")
    else:
        print(f"✓ [EXISTENTE] {model.__name__}: {obj}")
    return obj, created

def create_test_data():
    """Função principal para criar todos os dados de teste."""
    print("=========================================")
    print("  INICIANDO CRIAÇÃO DE DADOS DE TESTE  ")
    print("=========================================\n")

    # --- 1. Criar Usuários ---
    print("--- 1. Criando Usuários ---")
    admin_user, admin_created = get_or_create_with_log(
        Usuario,
        login='admin_test',
        defaults={
            'nome_completo': 'Administrador Teste',
            'nivel_acesso': 'admin',
            'is_staff': True,
            'is_superuser': True
        }
    )
    if admin_created:
        admin_user.set_password('test123')
        admin_user.save()
        print("   - Senha definida para 'test123'")

    gerente_user, gerente_created = get_or_create_with_log(
        Usuario,
        login='gerente_test',
        defaults={
            'nome_completo': 'Gerente Teste',
            'nivel_acesso': 'gerente',
            'is_staff': True
        }
    )
    if gerente_created:
        gerente_user.set_password('test123')
        gerente_user.save()
        print("   - Senha definida para 'test123'")
    print("\n")

    # --- 2. Criar Obras ---
    print("--- 2. Criando Obras ---")
    obras_data = [
        {'nome_obra': 'Construção Residencial Alpha', 'cidade': 'São Paulo', 'orcamento': '650000.00'},
        {'nome_obra': 'Edifício Comercial Beta', 'cidade': 'Rio de Janeiro', 'orcamento': '1200000.00'},
        {'nome_obra': 'Shopping Center Gamma', 'cidade': 'Belo Horizonte', 'orcamento': '3500000.00'},
    ]
    obras = []
    for data in obras_data:
        obra, _ = get_or_create_with_log(
            Obra,
            nome_obra=data['nome_obra'],
            defaults={
                'status': 'Em Andamento',
                'cidade': data['cidade'],
                'endereco_completo': f"Endereço Fictício para {data['nome_obra']}",
                'orcamento_previsto': Decimal(data['orcamento']),
                'responsavel': gerente_user
            }
        )
        obras.append(obra)
    obra_alpha, obra_beta, obra_gamma = obras[0], obras[1], obras[2]
    print("\n")

    # --- 3. Criar Materiais ---
    print("--- 3. Criando Materiais ---")
    materiais_data = [
        {'nome': 'Cimento Portland CP II', 'categoria': 'Básico', 'unidade': 'saco 50kg', 'estoque_minimo': 20, 'estoque_atual': 100},
        {'nome': 'Vergalhão de Aço CA-50 10mm', 'categoria': 'Estrutural', 'unidade': 'barra 12m', 'estoque_minimo': 50, 'estoque_atual': 200},
        {'nome': 'Tijolo Baiano 9 furos', 'categoria': 'Alvenaria', 'unidade': 'unidade', 'estoque_minimo': 2000, 'estoque_atual': 5000},
        {'nome': 'Tinta Acrílica Branca Fosca', 'categoria': 'Acabamento', 'unidade': 'lata 18L', 'estoque_minimo': 10, 'estoque_atual': 30},
        {'nome': 'Cabo Flexível 2.5mm', 'categoria': 'Elétrico', 'unidade': 'rolo 100m', 'estoque_minimo': 5, 'estoque_atual': 15},
        {'nome': 'Tubo PVC Esgoto 100mm', 'categoria': 'Hidráulico', 'unidade': 'barra 6m', 'estoque_minimo': 10, 'estoque_atual': 40},
    ]
    materiais = [get_or_create_with_log(Material, nome=data['nome'], defaults=data)[0] for data in materiais_data]
    print("\n")
    
    # --- 4. Criar Compras ---
    print("--- 4. Criando Compras (associadas às obras) ---")
    compras_data = [
        {'obra': obra_alpha, 'material': materiais[0], 'qtd': 50, 'preco_unit': '35.00', 'status': 'Entregue'},
        {'obra': obra_alpha, 'material': materiais[2], 'qtd': 3000, 'preco_unit': '1.80', 'status': 'Entregue'},
        {'obra': obra_beta, 'material': materiais[1], 'qtd': 100, 'preco_unit': '45.50', 'status': 'Entregue'},
        {'obra': obra_beta, 'material': materiais[4], 'qtd': 10, 'preco_unit': '120.00', 'status': 'Pendente'},
        {'obra': obra_beta, 'material': materiais[5], 'qtd': 20, 'preco_unit': '55.00', 'status': 'Entregue'},
        {'obra': obra_gamma, 'material': materiais[3], 'qtd': 15, 'preco_unit': '350.00', 'status': 'Entregue'},
    ]
    compras_criadas = 0
    for data in compras_data:
        compra, created = get_or_create_with_log(
            Compra,
            obra=data['obra'],
            material=data['material'],
            quantidade=data['qtd'],
            defaults={
                'preco_unitario': Decimal(data['preco_unit']),
                'status_compra': data['status'],
                'data_compra': date.today() - timedelta(days=random.randint(5, 30)),
                'fornecedor': 'Fornecedor Padrão Teste',
                'categoria_uso': 'Uso Direto na Obra'
            }
        )
        if created:
            compras_criadas += 1
            print(f"   -> Compra de {compra.quantidade}x {compra.material.nome} para {compra.obra.nome_obra}")
    print("\n")

    # --- 5. Criar Funcionários e Equipes ---
    print("--- 5. Criando Funcionários e Equipes ---")
    funcionarios_data = [
        {'nome_completo': 'João Silva Santos', 'cargo': 'Pedreiro', 'valor_diaria': '150.00'},
        {'nome_completo': 'Maria Oliveira Costa', 'cargo': 'Eletricista', 'valor_diaria': '180.00'},
        {'nome_completo': 'Carlos Eduardo Lima', 'cargo': 'Encanador', 'valor_diaria': '160.00'},
    ]
    funcionarios = [get_or_create_with_log(
        Funcionario,
        nome_completo=data['nome_completo'],
        defaults={'cargo': data['cargo'], 'valor_diaria_padrao': Decimal(data['valor_diaria'])}
    )[0] for data in funcionarios_data]

    equipes_data = [{'nome_equipe': 'Equipe Estrutural'}, {'nome_equipe': 'Equipe Acabamento'}]
    equipes = [get_or_create_with_log(Equipe, nome_equipe=data['nome_equipe'])[0] for data in equipes_data]
    print("\n")

    # --- 6. Criar Locações ---
    print("--- 6. Criando Locações (associadas às obras) ---")
    hoje = date.today()
    locacoes_data = [
        {'obra': obra_beta, 'funcionario_locado': funcionarios[0], 'inicio_dias_atras': 10, 'duracao': 2, 'valor': '300.00'},
        {'obra': obra_beta, 'equipe': equipes[0], 'inicio_dias_atras': 8, 'duracao': 3, 'valor': '2500.00'},
        {'obra': obra_alpha, 'servico_externo': 'Terraplanagem', 'inicio_dias_atras': 15, 'duracao': 5, 'valor': '5000.00'},
        {'obra': obra_beta, 'servico_externo': 'Aluguel de Betoneira', 'inicio_dias_atras': 5, 'duracao': 10, 'valor': '1200.00'},
    ]
    locacoes_criadas_count = 0
    for data in locacoes_data:
        data_inicio = hoje - timedelta(days=data['inicio_dias_atras'])
        data_fim = data_inicio + timedelta(days=data['duracao'])
        
        # Construir o filtro para evitar duplicatas
        filter_kwargs = {
            'obra': data['obra'],
            'data_locacao_inicio': data_inicio,
        }
        if data.get('funcionario_locado'):
            filter_kwargs['funcionario_locado'] = data.get('funcionario_locado')
        elif data.get('equipe'):
            filter_kwargs['equipe'] = data.get('equipe')
        else:
            filter_kwargs['servico_externo'] = data.get('servico_externo')

        if not Locacao_Obras_Equipes.objects.filter(**filter_kwargs).exists():
            locacao = Locacao_Obras_Equipes.objects.create(
                obra=data['obra'],
                funcionario_locado=data.get('funcionario_locado'),
                equipe=data.get('equipe'),
                servico_externo=data.get('servico_externo'),
                data_locacao_inicio=data_inicio,
                data_locacao_fim=data_fim,
                valor_pagamento=Decimal(data['valor']),
                status_locacao='ativa',
                observacoes=f"Locação de teste para {data.get('servico_externo') or data.get('equipe') or data.get('funcionario_locado')}"
            )
            locacoes_criadas_count += 1
            print(f"✓ [CRIADO] Locacao: {locacao.get_recurso_display()} para {locacao.obra.nome_obra}")
        else:
            print(f"✓ [EXISTENTE] Locacao similar já existe para {data['obra'].nome_obra} na data {data_inicio}")

    print("\n=========================================")
    print("      SCRIPT DE POPULAÇÃO CONCLUÍDO      ")
    print("=========================================")
    print("📊 RESUMO:")
    print(f"   - Obras: {len(obras)}")
    print(f"   - Materiais: {len(materiais)}")
    print(f"   - Compras Criadas: {compras_criadas}")
    print(f"   - Funcionários: {len(funcionarios)}")
    print(f"   - Equipes: {len(equipes)}")
    print(f"   - Locações Criadas: {locacoes_criadas_count}")
    print("\n🔑 USUÁRIOS DE TESTE:")
    print("   - admin_test / test123 (Administrador)")
    print("   - gerente_test / test123 (Gerente)")
    print("\n💡 Dica: Verifique a página de detalhes da 'Edifício Comercial Beta' para ver os novos dados.")


if __name__ == '__main__':
    try:
        create_test_data()
    except Exception as e:
        print(f"\n❌ ERRO AO EXECUTAR O SCRIPT: {e}")
        import traceback
        traceback.print_exc()