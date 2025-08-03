#!/usr/bin/env python
"""
Script para popular o banco de dados com dados de teste, incluindo Obras,
Materiais, Compras e Locações para um teste mais completo e diversificado.
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
        defaults={'nome_completo': 'Administrador Teste', 'nivel_acesso': 'admin', 'is_staff': True, 'is_superuser': True}
    )
    if admin_created:
        admin_user.set_password('test123')
        admin_user.save()
        print("   - Senha definida para 'test123'")

    gerente_user, gerente_created = get_or_create_with_log(
        Usuario,
        login='gerente_test',
        defaults={'nome_completo': 'Gerente Teste', 'nivel_acesso': 'gerente', 'is_staff': True}
    )
    if gerente_created:
        gerente_user.set_password('test123')
        gerente_user.save()
        print("   - Senha definida para 'test123'")
    print("\n")

    # --- 2. Criar Funcionário Responsável ---
    print("--- 2. Criando Funcionário Responsável ---")
    responsavel_func, _ = get_or_create_with_log(
        Funcionario,
        nome_completo='Carlos Gerente de Obras',
        defaults={'cargo': 'Gerente de Obras', 'valor_diaria_padrao': Decimal('350.00')}
    )
    print("\n")

    # --- 3. Criar Obras ---
    print("--- 3. Criando Obras ---")
    obras_data = [
        {'nome_obra': 'Construção Residencial Alpha', 'cidade': 'São Paulo', 'orcamento': '650000.00'},
        {'nome_obra': 'Edifício Comercial Beta', 'cidade': 'Rio de Janeiro', 'orcamento': '1200000.00'},
        {'nome_obra': 'Shopping Center Gamma', 'cidade': 'Belo Horizonte', 'orcamento': '3500000.00'},
        {'nome_obra': 'Reforma Hospital Delta', 'cidade': 'Salvador', 'orcamento': '850000.00'},
        {'nome_obra': 'Condomínio Epsilon', 'cidade': 'Curitiba', 'orcamento': '2100000.00'},
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
                'responsavel': responsavel_func
            }
        )
        obras.append(obra)
    print("\n")

    # --- 4. Criar Materiais com Categorias Diversificadas ---
    print("--- 4. Criando Materiais com Categorias Diversificadas ---")
    materiais_data = [
        # Fundação & Estrutural
        {'nome': 'Cimento Portland CP II', 'categoria': 'Fundação', 'unidade': 'saco 50kg', 'estoque_minimo': 20, 'estoque_atual': 100},
        {'nome': 'Vergalhão de Aço CA-50 10mm', 'categoria': 'Estrutural', 'unidade': 'barra 12m', 'estoque_minimo': 50, 'estoque_atual': 200},
        {'nome': 'Tábua de Pinus 30cm', 'categoria': 'Estrutural', 'unidade': 'unidade', 'estoque_minimo': 100, 'estoque_atual': 300},
        # Alvenaria
        {'nome': 'Tijolo Baiano 9 furos', 'categoria': 'Alvenaria', 'unidade': 'milheiro', 'estoque_minimo': 2, 'estoque_atual': 5},
        {'nome': 'Argamassa ACIII', 'categoria': 'Alvenaria', 'unidade': 'saco 20kg', 'estoque_minimo': 30, 'estoque_atual': 80},
        # Hidráulica
        {'nome': 'Tubo PVC Esgoto 100mm', 'categoria': 'Hidráulica', 'unidade': 'barra 6m', 'estoque_minimo': 10, 'estoque_atual': 40},
        {'nome': 'Registro de Gaveta 3/4"', 'categoria': 'Hidráulica', 'unidade': 'unidade', 'estoque_minimo': 15, 'estoque_atual': 50},
        # Elétrico
        {'nome': 'Cabo Flexível 2.5mm', 'categoria': 'Elétrico', 'unidade': 'rolo 100m', 'estoque_minimo': 5, 'estoque_atual': 15},
        {'nome': 'Disjuntor Monopolar 20A', 'categoria': 'Elétrico', 'unidade': 'unidade', 'estoque_minimo': 20, 'estoque_atual': 60},
        # Acabamento
        {'nome': 'Tinta Acrílica Branca Fosca', 'categoria': 'Acabamento', 'unidade': 'lata 18L', 'estoque_minimo': 10, 'estoque_atual': 30},
        {'nome': 'Porcelanato Acetinado 80x80', 'categoria': 'Acabamento', 'unidade': 'm²', 'estoque_minimo': 50, 'estoque_atual': 150},
    ]
    materiais = [get_or_create_with_log(Material, nome=data['nome'], defaults=data)[0] for data in materiais_data]
    print("\n")
    
    # --- 5. Criar Compras ---
    print("--- 5. Criando Compras (associadas às obras) ---")
    # Limpar para garantir que a lista de compras seja representativa dos materiais
    compras_criadas = 0
    for obra in obras:
        # Cada obra terá entre 2 e 4 compras de materiais aleatórios
        num_compras = random.randint(2, 4)
        for _ in range(num_compras):
            material_comprado = random.choice(materiais)
            qtd = random.randint(5, 50)
            preco_unit = Decimal(random.uniform(5.0, 500.0)).quantize(Decimal('0.01'))

            compra, created = get_or_create_with_log(
                Compra,
                obra=obra,
                material=material_comprado,
                quantidade=qtd,
                preco_unitario=preco_unit,
                defaults={
                    'status_compra': random.choice(['Entregue', 'Pendente', 'Cancelada']),
                    'data_compra': date.today() - timedelta(days=random.randint(5, 45)),
                    'fornecedor': f"Fornecedor {random.choice(['A', 'B', 'C'])}",
                    'categoria_uso': 'Uso Direto na Obra'
                }
            )
            if created:
                compras_criadas += 1
                print(f"   -> Compra de {compra.quantidade}x {compra.material.nome} para {compra.obra.nome_obra}")
    print("\n")

    # --- 6. Criar Funcionários e Equipes ---
    print("--- 6. Criando Funcionários e Equipes ---")
    funcionarios_data = [
        {'nome_completo': 'João Silva Santos', 'cargo': 'Pedreiro', 'valor_diaria': '150.00'},
        {'nome_completo': 'Maria Oliveira Costa', 'cargo': 'Eletricista', 'valor_diaria': '180.00'},
        {'nome_completo': 'Carlos Eduardo Lima', 'cargo': 'Encanador', 'valor_diaria': '160.00'},
        {'nome_completo': 'Ana Paula Ferreira', 'cargo': 'Pintora', 'valor_diaria': '140.00'},
    ]
    funcionarios = [get_or_create_with_log(
        Funcionario,
        nome_completo=data['nome_completo'],
        defaults={'cargo': data['cargo'], 'valor_diaria_padrao': Decimal(data['valor_diaria'])}
    )[0] for data in funcionarios_data]

    equipes_data = [{'nome_equipe': 'Equipe Estrutural'}, {'nome_equipe': 'Equipe Acabamento'}, {'nome_equipe': 'Equipe Hidro/Elétrica'}]
    equipes = [get_or_create_with_log(Equipe, nome_equipe=data['nome_equipe'])[0] for data in equipes_data]
    print("\n")

    # --- 7. Criar Locações ---
    print("--- 7. Criando Locações (associadas às obras) ---")
    locacoes_criadas_count = 0
    for obra in obras:
        # Cada obra terá entre 1 e 3 locações
        num_locacoes = random.randint(1, 3)
        for _ in range(num_locacoes):
            tipo_locacao = random.choice(['funcionario', 'equipe', 'servico'])
            data_inicio = date.today() - timedelta(days=random.randint(1, 60))
            data_fim = data_inicio + timedelta(days=random.randint(1, 5))
            valor = Decimal(random.uniform(200.0, 3000.0)).quantize(Decimal('0.01'))

            loc_kwargs = {'obra': obra, 'data_locacao_inicio': data_inicio, 'data_locacao_fim': data_fim, 'valor_pagamento': valor, 'status_locacao': 'ativa'}

            if tipo_locacao == 'funcionario':
                loc_kwargs['funcionario_locado'] = random.choice(funcionarios)
            elif tipo_locacao == 'equipe':
                loc_kwargs['equipe'] = random.choice(equipes)
            else:
                loc_kwargs['servico_externo'] = f"Serviço Terceirizado de {random.choice(['Guindaste', 'Terraplanagem', 'Consultoria'])}"

            # Evitar duplicatas exatas
            if not Locacao_Obras_Equipes.objects.filter(obra=obra, data_locacao_inicio=data_inicio, funcionario_locado=loc_kwargs.get('funcionario_locado'), equipe=loc_kwargs.get('equipe'), servico_externo=loc_kwargs.get('servico_externo')).exists():
                locacao = Locacao_Obras_Equipes.objects.create(**loc_kwargs)
                locacoes_criadas_count += 1
                print(f"✓ [CRIADO] Locacao: {locacao.get_recurso_display()} para {locacao.obra.nome_obra}")

    print("\n=========================================")
    print("      SCRIPT DE POPULAÇÃO CONCLUÍDO      ")
    print("=========================================")
    print("📊 RESUMO:")
    print(f"   - Obras: {len(obras)}")
    print(f"   - Materiais: {len(materiais)}")
    print(f"   - Compras Criadas: {compras_criadas}")
    print(f"   - Funcionários: {len(funcionarios) + 1}") # +1 pelo gerente
    print(f"   - Equipes: {len(equipes)}")
    print(f"   - Locações Criadas: {locacoes_criadas_count}")
    print("\n🔑 USUÁRIOS DE TESTE:")
    print("   - admin_test / test123 (Administrador)")
    print("   - gerente_test / test123 (Gerente)")
    print("\n💡 Dica: Verifique as páginas de detalhes das obras para ver os novos dados.")


if __name__ == '__main__':
    try:
        create_test_data()
    except Exception as e:
        print(f"\n❌ ERRO AO EXECUTAR O SCRIPT: {e}")
        import traceback
        traceback.print_exc()