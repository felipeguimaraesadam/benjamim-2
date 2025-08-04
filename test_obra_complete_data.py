#!/usr/bin/env python
"""
Script de teste completo para popular dados de obra e verificar funcionalidades
"""

import os
import sys
import django
import json
from datetime import datetime, timedelta
from decimal import Decimal
from django.utils import timezone

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
django.setup()

from core.models import (
    Obra, Funcionario, Equipe, Material,
    Compra, ItemCompra, Locacao_Obras_Equipes, Despesa_Extra
)

class ObraTestDataCreator:
    def __init__(self):
        self.logs = []
        self.obra = None
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] {level}: {message}"
        print(log_entry)
        self.logs.append(log_entry)
        
    def create_test_obra(self):
        """Criar obra de teste"""
        try:
            self.obra = Obra.objects.create(
                nome_obra="Obra Teste Completa",
                endereco_completo="Rua Teste, 123 - Bairro Teste",
                cidade="Cidade Teste",
                orcamento_previsto=Decimal('150000.00'),
                data_inicio=datetime.now().date(),
                data_prevista_fim=(datetime.now() + timedelta(days=180)).date(),
                status="Em Andamento"
            )
            self.log(f"✓ Obra criada: {self.obra.nome_obra} (ID: {self.obra.id})")
            return True
        except Exception as e:
            self.log(f"✗ Erro ao criar obra: {str(e)}", "ERROR")
            return False
            
    def create_test_funcionarios(self):
        """Criar funcionários de teste"""
        funcionarios_data = [
            {"nome_completo": "João Silva", "cargo": "Pedreiro", "valor_diaria_padrao": 120.00, "data_contratacao": timezone.now().date()},
            {"nome_completo": "Maria Santos", "cargo": "Eletricista", "valor_diaria_padrao": 150.00, "data_contratacao": timezone.now().date()},
            {"nome_completo": "Pedro Costa", "cargo": "Encanador", "valor_diaria_padrao": 140.00, "data_contratacao": timezone.now().date()},
            {"nome_completo": "Ana Oliveira", "cargo": "Pintora", "valor_diaria_padrao": 100.00, "data_contratacao": timezone.now().date()},
        ]
        
        created_count = 0
        for func_data in funcionarios_data:
            try:
                funcionario, created = Funcionario.objects.get_or_create(
                    nome_completo=func_data["nome_completo"],
                    defaults=func_data
                )
                if created:
                    self.log(f"✓ Funcionário criado: {funcionario.nome_completo} - {funcionario.cargo}")
                else:
                    self.log(f"✓ Funcionário já existe: {funcionario.nome_completo} - {funcionario.cargo}")
                created_count += 1
            except Exception as e:
                self.log(f"✗ Erro ao criar funcionário {func_data['nome_completo']}: {str(e)}", "ERROR")
                
        return created_count == len(funcionarios_data)
        
    def create_test_equipes(self):
        """Cria equipes de teste"""
        funcionarios = list(Funcionario.objects.all())
        if len(funcionarios) < 2:
            self.log("✗ Não há funcionários suficientes para criar equipes", level="ERROR")
            return False
            
        equipes_data = [
            {"nome_equipe": "Equipe Estrutura", "funcionarios": funcionarios[:2]},
            {"nome_equipe": "Equipe Acabamento", "funcionarios": funcionarios[2:]},
        ]
        
        created_count = 0
        for equipe_data in equipes_data:
            try:
                equipe, created = Equipe.objects.get_or_create(
                    nome_equipe=equipe_data["nome_equipe"]
                )
                equipe.membros.set(equipe_data["funcionarios"])
                if created:
                    self.log(f"✓ Equipe criada: {equipe.nome_equipe} com {equipe.membros.count()} funcionários")
                else:
                    self.log(f"✓ Equipe já existe: {equipe.nome_equipe} com {equipe.membros.count()} funcionários")
                created_count += 1
            except Exception as e:
                self.log(f"✗ Erro ao criar equipe {equipe_data['nome_equipe']}: {str(e)}", "ERROR")
                
        return created_count == len(equipes_data)
        
    def create_test_categorias_materiais(self):
        """Criar materiais de teste com categorias predefinidas"""
        materiais_data = [
            {"nome": "Cimento CP-II 50kg", "categoria": "Geral", "unidade": "saco"},
            {"nome": "Argamassa AC-I 20kg", "categoria": "Geral", "unidade": "saco"},
            {"nome": "Tijolo Cerâmico 6 furos", "categoria": "Alvenaria", "unidade": "un"},
            {"nome": "Bloco Concreto 14x19x39", "categoria": "Alvenaria", "unidade": "un"},
            {"nome": "Ferro 10mm CA-50", "categoria": "Fundacao", "unidade": "kg"},
            {"nome": "Arame Recozido 18", "categoria": "Geral", "unidade": "kg"},
            {"nome": "Tinta Látex Branca 18L", "categoria": "Acabamento", "unidade": "un"},
            {"nome": "Verniz Marítimo 3,6L", "categoria": "Acabamento", "unidade": "un"},
        ]
        
        created_materiais = 0
        
        for mat_data in materiais_data:
            try:
                material, created = Material.objects.get_or_create(
                    nome=mat_data["nome"],
                    defaults={
                        "categoria_uso_padrao": mat_data["categoria"],
                        "unidade_medida": mat_data["unidade"]
                    }
                )
                if created:
                    self.log(f"✓ Material criado: {material.nome} - Categoria: {material.categoria_uso_padrao}")
                else:
                    self.log(f"✓ Material já existe: {material.nome} - Categoria: {material.categoria_uso_padrao}")
                created_materiais += 1
            except Exception as e:
                self.log(f"✗ Erro ao criar material {mat_data['nome']}: {str(e)}", "ERROR")
                
        return created_materiais > 0
        
    def create_test_compras(self):
        """Criar compras de teste com diferentes categorias"""
        materiais = list(Material.objects.all())
        if not materiais:
            self.log("✗ Nenhum material encontrado para criar compras", "ERROR")
            return False
            
        compras_data = [
            # Compras efetivas
            {"material": materiais[0], "quantidade": "50", "valor_unitario": "32.50", "tipo": "COMPRA", "dias_atras": 30},
            {"material": materiais[1], "quantidade": "30", "valor_unitario": "18.90", "tipo": "COMPRA", "dias_atras": 25},
            {"material": materiais[2], "quantidade": "1000", "valor_unitario": "0.85", "tipo": "COMPRA", "dias_atras": 20},
            {"material": materiais[3], "quantidade": "200", "valor_unitario": "4.20", "tipo": "COMPRA", "dias_atras": 15},
            {"material": materiais[4], "quantidade": "500", "valor_unitario": "6.80", "tipo": "COMPRA", "dias_atras": 10},
            {"material": materiais[5], "quantidade": "100", "valor_unitario": "8.50", "tipo": "COMPRA", "dias_atras": 8},
            # Orçamentos
            {"material": materiais[6], "quantidade": "5", "valor_unitario": "85.00", "tipo": "ORCAMENTO", "dias_atras": 5},
            {"material": materiais[7], "quantidade": "3", "valor_unitario": "120.00", "tipo": "ORCAMENTO", "dias_atras": 3},
        ]
        
        created_count = 0
        for compra_data in compras_data:
            try:
                data_compra = (datetime.now() - timedelta(days=compra_data["dias_atras"])).date()
                quantidade = Decimal(compra_data["quantidade"])
                valor_unitario = Decimal(compra_data["valor_unitario"])
                valor_total_item = quantidade * valor_unitario
                
                # Criar a compra
                compra = Compra.objects.create(
                    obra=self.obra,
                    data_compra=data_compra,
                    tipo=compra_data["tipo"],
                    fornecedor=f"Fornecedor {compra_data['material'].categoria_uso_padrao or 'Geral'}",
                    nota_fiscal=f"NF-{1000 + created_count}",
                    valor_total_bruto=valor_total_item,
                    valor_total_liquido=valor_total_item
                )
                
                # Criar o item da compra
                item_compra = ItemCompra.objects.create(
                    compra=compra,
                    material=compra_data["material"],
                    quantidade=quantidade,
                    valor_unitario=valor_unitario,
                    categoria_uso=compra_data["material"].categoria_uso_padrao
                )
                
                self.log(f"✓ {compra.tipo} criada: {item_compra.material.nome} - Qtd: {quantidade} - Total: R$ {valor_total_item}")
                created_count += 1
                
            except Exception as e:
                self.log(f"✗ Erro ao criar compra {compra_data['material'].nome}: {str(e)}", "ERROR")
                
        return created_count > 0
        
    def create_test_locacoes(self):
        """Criar locações de equipe de teste"""
        equipes = list(Equipe.objects.all())
        if not equipes:
            self.log("✗ Nenhuma equipe encontrada para criar locações", "ERROR")
            return False
            
        locacoes_data = [
            {"equipe": equipes[0], "dias": 15, "valor_diario": "300.00", "dias_atras": 20},
            {"equipe": equipes[1] if len(equipes) > 1 else equipes[0], "dias": 10, "valor_diario": "250.00", "dias_atras": 10},
        ]
        
        created_count = 0
        for loc_data in locacoes_data:
            try:
                data_inicio = (datetime.now() - timedelta(days=loc_data["dias_atras"])).date()
                data_fim = data_inicio + timedelta(days=loc_data["dias"])
                
                locacao = Locacao_Obras_Equipes.objects.create(
                     obra=self.obra,
                     equipe=loc_data["equipe"],
                     data_locacao_inicio=data_inicio,
                     data_locacao_fim=data_fim,
                     valor_pagamento=Decimal(loc_data["valor_diario"]),
                     observacoes=f"Serviços de {loc_data['equipe'].nome_equipe}"
                 )
                
                valor_total = locacao.valor_pagamento * loc_data["dias"]
                self.log(f"✓ Locação criada: {locacao.equipe.nome_equipe} - {loc_data['dias']} dias - Total: R$ {valor_total}")
                created_count += 1
                
            except Exception as e:
                self.log(f"✗ Erro ao criar locação {loc_data['equipe'].nome_equipe}: {str(e)}", "ERROR")
                
        return created_count > 0
        
    def create_test_despesas_extras(self):
        """Criar despesas extras de teste"""
        despesas_data = [
            {"descricao": "Transporte de materiais", "valor": "450.00", "dias_atras": 15},
            {"descricao": "Aluguel de equipamentos", "valor": "800.00", "dias_atras": 10},
            {"descricao": "Combustível para máquinas", "valor": "320.00", "dias_atras": 5},
        ]
        
        created_count = 0
        for desp_data in despesas_data:
            try:
                data_despesa = (datetime.now() - timedelta(days=desp_data["dias_atras"])).date()
                
                despesa = Despesa_Extra.objects.create(
                    obra=self.obra,
                    descricao=desp_data["descricao"],
                    valor=Decimal(desp_data["valor"]),
                    data=data_despesa
                )
                
                self.log(f"✓ Despesa extra criada: {despesa.descricao} - R$ {despesa.valor}")
                created_count += 1
                
            except Exception as e:
                self.log(f"✗ Erro ao criar despesa {desp_data['descricao']}: {str(e)}", "ERROR")
                
        return created_count > 0
        
    def verify_obra_data(self):
        """Verificar se todos os dados da obra estão corretos"""
        if not self.obra:
            self.log("✗ Obra não encontrada para verificação", "ERROR")
            return False
            
        self.log("\n=== VERIFICAÇÃO DOS DADOS DA OBRA ===")
        
        # Verificar compras por categoria
        compras = Compra.objects.filter(obra=self.obra)
        self.log(f"Total de compras/orçamentos: {compras.count()}")
        
        compras_efetivas = compras.filter(tipo='COMPRA')
        orcamentos = compras.filter(tipo='ORCAMENTO')
        self.log(f"Compras efetivas: {compras_efetivas.count()}")
        self.log(f"Orçamentos: {orcamentos.count()}")
        
        # Verificar gastos por categoria de material
        gastos_por_categoria = {}
        for compra in compras_efetivas:
            for item in compra.itens.all():
                categoria = item.categoria_uso or item.material.categoria_uso_padrao or 'Geral'
                valor = item.valor_total_item
                gastos_por_categoria[categoria] = gastos_por_categoria.get(categoria, 0) + float(valor)
            
        self.log("\nGastos por categoria de material:")
        for categoria, valor in gastos_por_categoria.items():
            self.log(f"  {categoria}: R$ {valor:.2f}")
            
        if not gastos_por_categoria:
            self.log("✗ ERRO: Nenhum gasto por categoria encontrado!", "ERROR")
            return False
            
        # Verificar locações
        locacoes = Locacao_Obras_Equipes.objects.filter(obra=self.obra)
        self.log(f"\nTotal de locações: {locacoes.count()}")
        
        total_locacoes = sum(float(loc.valor_pagamento) for loc in locacoes)
        self.log(f"Valor total das locações: R$ {total_locacoes:.2f}")
        
        # Verificar despesas extras
        despesas = Despesa_Extra.objects.filter(obra=self.obra)
        self.log(f"\nTotal de despesas extras: {despesas.count()}")
        
        total_despesas = sum(float(desp.valor) for desp in despesas)
        self.log(f"Valor total das despesas: R$ {total_despesas:.2f}")
        
        # Calcular totais
        total_materiais = sum(gastos_por_categoria.values())
        custo_total = total_materiais + total_locacoes + total_despesas
        
        self.log(f"\n=== RESUMO FINANCEIRO ===")
        self.log(f"Orçamento previsto: R$ {float(self.obra.orcamento_previsto):.2f}")
        self.log(f"Total gasto em materiais: R$ {total_materiais:.2f}")
        self.log(f"Total gasto em locações: R$ {total_locacoes:.2f}")
        self.log(f"Total gasto em despesas extras: R$ {total_despesas:.2f}")
        self.log(f"Custo total realizado: R$ {custo_total:.2f}")
        
        percentual_gasto = (custo_total / float(self.obra.orcamento_previsto)) * 100
        self.log(f"Percentual do orçamento utilizado: {percentual_gasto:.1f}%")
        
        return True
        
    def run_complete_test(self):
        """Executar teste completo"""
        self.log("=== INICIANDO TESTE COMPLETO DE DADOS DA OBRA ===")
        
        steps = [
            ("Criando obra de teste", self.create_test_obra),
            ("Criando funcionários", self.create_test_funcionarios),
            ("Criando equipes", self.create_test_equipes),
            ("Criando categorias e materiais", self.create_test_categorias_materiais),
            ("Criando compras e orçamentos", self.create_test_compras),
            ("Criando locações de equipe", self.create_test_locacoes),
            ("Criando despesas extras", self.create_test_despesas_extras),
            ("Verificando dados da obra", self.verify_obra_data),
        ]
        
        success_count = 0
        for step_name, step_func in steps:
            self.log(f"\n--- {step_name} ---")
            if step_func():
                success_count += 1
            else:
                self.log(f"✗ Falha na etapa: {step_name}", "ERROR")
                
        self.log(f"\n=== RESULTADO FINAL ===")
        self.log(f"Etapas concluídas com sucesso: {success_count}/{len(steps)}")
        
        if success_count == len(steps):
            self.log("✓ TESTE COMPLETO EXECUTADO COM SUCESSO!")
            if self.obra:
                self.log(f"✓ Obra de teste criada com ID: {self.obra.id}")
                self.log(f"✓ Acesse: http://localhost:5173/obras/{self.obra.id}")
        else:
            self.log("✗ TESTE FALHOU - Algumas etapas não foram concluídas", "ERROR")
            
        return success_count == len(steps)
        
    def save_logs(self):
        """Salvar logs em arquivo"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_file = f"test_obra_complete_{timestamp}.log"
        
        with open(log_file, 'w', encoding='utf-8') as f:
            f.write("\n".join(self.logs))
            
        self.log(f"Logs salvos em: {log_file}")

if __name__ == "__main__":
    creator = ObraTestDataCreator()
    success = creator.run_complete_test()
    creator.save_logs()
    
    sys.exit(0 if success else 1)