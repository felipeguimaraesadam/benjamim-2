#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import django
from datetime import datetime
import shutil
import argparse
from decouple import config
import dj_database_url

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.models import Material, Obra, Compra, ItemCompra
from django.db import transaction

def get_database_info():
    """Detecta se estamos usando SQLite local ou PostgreSQL remoto"""
    from django.conf import settings
    db_config = settings.DATABASES['default']
    
    if db_config['ENGINE'] == 'django.db.backends.sqlite3':
        return 'sqlite', db_config['NAME']
    elif db_config['ENGINE'] == 'django.db.backends.postgresql':
        return 'postgresql', f"{db_config['HOST']}:{db_config['PORT']}/{db_config['NAME']}"
    else:
        return 'unknown', str(db_config)

def create_backup():
    """Cria backup do banco de dados (apenas para SQLite local)"""
    db_type, db_info = get_database_info()
    
    if db_type == 'sqlite':
        db_path = db_info
        if not os.path.exists(db_path):
            print(f"❌ Arquivo de banco {db_path} não encontrado!")
            return False
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_path = f'{db_path}.backup_{timestamp}'
        
        try:
            shutil.copy2(db_path, backup_path)
            print(f"✅ Backup criado: {backup_path}")
            return True
        except Exception as e:
            print(f"❌ Erro ao criar backup: {e}")
            return False
    
    elif db_type == 'postgresql':
        print(f"ℹ️  Conectado ao PostgreSQL: {db_info}")
        print("⚠️  ATENÇÃO: Executando no banco de PRODUÇÃO!")
        print("💾 Para PostgreSQL, recomenda-se fazer backup via pg_dump")
        return True
    
    else:
        print(f"❌ Tipo de banco não suportado: {db_type}")
        return False

def get_character_mapping():
    """Mapeamento de caracteres corrompidos para caracteres corretos"""
    return {
        '▓': '²',  # Metro quadrado
        '³': '³',  # Metro cúbico (caso já esteja correto)
        '°': '°',  # Grau (caso já esteja correto)
        '¹': '¹',  # Sobrescrito 1
        '²': '²',  # Sobrescrito 2 (caso já esteja correto)
        '³': '³',  # Sobrescrito 3 (caso já esteja correto)
        '½': '½',  # Meio
        '¼': '¼',  # Um quarto
        '¾': '¾',  # Três quartos
        '�': '²',  # Caractere de substituição genérico -> assumir m²
    }

def fix_text_field(text, char_mapping):
    """Corrigir caracteres corrompidos em um campo de texto"""
    if not text:
        return text, False
    
    original_text = text
    fixed_text = text
    
    for corrupted_char, correct_char in char_mapping.items():
        if corrupted_char in fixed_text:
            fixed_text = fixed_text.replace(corrupted_char, correct_char)
    
    return fixed_text, fixed_text != original_text

def identify_corrupted_records():
    """Identificar todos os registros com caracteres corrompidos"""
    print("🔍 Identificando registros com caracteres corrompidos...")
    
    char_mapping = get_character_mapping()
    corrupted_chars = list(char_mapping.keys())
    
    corrupted_records = {
        'materials': [],
        'obras': [],
        'compras': [],
        'item_compras': []
    }
    
    # Verificar Materiais
    for material in Material.objects.all():
        issues = []
        
        if material.nome and any(char in material.nome for char in corrupted_chars):
            issues.append(f"nome: '{material.nome}'")
            
        if material.unidade_medida and any(char in material.unidade_medida for char in corrupted_chars):
            issues.append(f"unidade_medida: '{material.unidade_medida}'")
        
        if issues:
            corrupted_records['materials'].append({
                'id': material.id,
                'object': material,
                'issues': issues
            })
    
    # Verificar Obras
    for obra in Obra.objects.all():
        issues = []
        
        if obra.nome_obra and any(char in obra.nome_obra for char in corrupted_chars):
            issues.append(f"nome_obra: '{obra.nome_obra}'")
            
        if obra.endereco_completo and any(char in obra.endereco_completo for char in corrupted_chars):
            issues.append(f"endereco_completo: '{obra.endereco_completo}'")
            
        if obra.cidade and any(char in obra.cidade for char in corrupted_chars):
            issues.append(f"cidade: '{obra.cidade}'")
        
        if issues:
            corrupted_records['obras'].append({
                'id': obra.id,
                'object': obra,
                'issues': issues
            })
    
    # Verificar Compras
    for compra in Compra.objects.all():
        issues = []
        
        if compra.fornecedor and any(char in compra.fornecedor for char in corrupted_chars):
            issues.append(f"fornecedor: '{compra.fornecedor}'")
            
        if compra.observacoes and any(char in compra.observacoes for char in corrupted_chars):
            issues.append(f"observacoes: '{compra.observacoes}'")
            
        if compra.nota_fiscal and any(char in compra.nota_fiscal for char in corrupted_chars):
            issues.append(f"nota_fiscal: '{compra.nota_fiscal}'")
        
        if issues:
            corrupted_records['compras'].append({
                'id': compra.id,
                'object': compra,
                'issues': issues
            })
    
    return corrupted_records

def fix_corrupted_data(corrupted_records, dry_run=True):
    """Corrigir dados corrompidos"""
    char_mapping = get_character_mapping()
    fixed_count = 0
    
    action = "Simulando" if dry_run else "Aplicando"
    print(f"🔧 {action} correções...")
    
    try:
        with transaction.atomic():
            # Corrigir Materiais
            for record in corrupted_records['materials']:
                material = record['object']
                changes = []
                
                if material.nome:
                    fixed_nome, changed = fix_text_field(material.nome, char_mapping)
                    if changed:
                        changes.append(f"nome: '{material.nome}' → '{fixed_nome}'")
                        if not dry_run:
                            material.nome = fixed_nome
                
                if material.unidade_medida:
                    fixed_unidade, changed = fix_text_field(material.unidade_medida, char_mapping)
                    if changed:
                        changes.append(f"unidade_medida: '{material.unidade_medida}' → '{fixed_unidade}'")
                        if not dry_run:
                            material.unidade_medida = fixed_unidade
                
                if changes:
                    print(f"  📦 Material ID {material.id}: {'; '.join(changes)}")
                    if not dry_run:
                        material.save()
                    fixed_count += 1
            
            # Corrigir Obras
            for record in corrupted_records['obras']:
                obra = record['object']
                changes = []
                
                if obra.nome_obra:
                    fixed_nome, changed = fix_text_field(obra.nome_obra, char_mapping)
                    if changed:
                        changes.append(f"nome_obra: '{obra.nome_obra}' → '{fixed_nome}'")
                        if not dry_run:
                            obra.nome_obra = fixed_nome
                
                if obra.endereco_completo:
                    fixed_endereco, changed = fix_text_field(obra.endereco_completo, char_mapping)
                    if changed:
                        changes.append(f"endereco_completo: '{obra.endereco_completo}' → '{fixed_endereco}'")
                        if not dry_run:
                            obra.endereco_completo = fixed_endereco
                
                if obra.cidade:
                    fixed_cidade, changed = fix_text_field(obra.cidade, char_mapping)
                    if changed:
                        changes.append(f"cidade: '{obra.cidade}' → '{fixed_cidade}'")
                        if not dry_run:
                            obra.cidade = fixed_cidade
                
                if changes:
                    print(f"  🏗️  Obra ID {obra.id}: {'; '.join(changes)}")
                    if not dry_run:
                        obra.save()
                    fixed_count += 1
            
            # Corrigir Compras
            for record in corrupted_records['compras']:
                compra = record['object']
                changes = []
                
                if compra.fornecedor:
                    fixed_fornecedor, changed = fix_text_field(compra.fornecedor, char_mapping)
                    if changed:
                        changes.append(f"fornecedor: '{compra.fornecedor}' → '{fixed_fornecedor}'")
                        if not dry_run:
                            compra.fornecedor = fixed_fornecedor
                
                if compra.observacoes:
                    fixed_observacoes, changed = fix_text_field(compra.observacoes, char_mapping)
                    if changed:
                        changes.append(f"observacoes: '{compra.observacoes}' → '{fixed_observacoes}'")
                        if not dry_run:
                            compra.observacoes = fixed_observacoes
                
                if compra.nota_fiscal:
                    fixed_nota, changed = fix_text_field(compra.nota_fiscal, char_mapping)
                    if changed:
                        changes.append(f"nota_fiscal: '{compra.nota_fiscal}' → '{fixed_nota}'")
                        if not dry_run:
                            compra.nota_fiscal = fixed_nota
                
                if changes:
                    print(f"  🛒 Compra ID {compra.id}: {'; '.join(changes)}")
                    if not dry_run:
                        compra.save()
                    fixed_count += 1
            
            if dry_run:
                # Rollback da transação para não salvar as mudanças
                raise Exception("Dry run - rollback intencional")
                
    except Exception as e:
        if not dry_run:
            print(f"❌ Erro durante as correções: {e}")
            return 0
    
    return fixed_count

def main():
    parser = argparse.ArgumentParser(description='Corrige caracteres corrompidos no banco de dados')
    parser.add_argument('--dry-run', action='store_true', help='Simula as correções sem aplicá-las')
    parser.add_argument('--force', action='store_true', help='Aplica correções sem confirmação')
    parser.add_argument('--production', action='store_true', help='Confirma execução em produção')
    args = parser.parse_args()
    
    print("=== CORREÇÃO DE CARACTERES CORROMPIDOS ===")
    print()
    
    # Verificar tipo de banco
    db_type, db_info = get_database_info()
    print(f"🗄️  Banco de dados: {db_type.upper()}")
    print(f"📍 Localização: {db_info}")
    print()
    
    # Verificar se é produção
    if db_type == 'postgresql':
        if not args.production and not args.dry_run:
            print("⚠️  ATENÇÃO: Detectado banco PostgreSQL (produção)")
            print("🛡️  Para executar em produção, use: --production")
            print("🧪 Para simular apenas, use: --dry-run")
            return
        elif args.production:
            print("⚠️  EXECUTANDO EM PRODUÇÃO - PostgreSQL")
            if not args.force:
                confirm = input("⚠️  Tem certeza? Digite 'CONFIRMO' para continuar: ")
                if confirm != 'CONFIRMO':
                    print("❌ Operação cancelada")
                    return
    
    # Criar backup
    print("🔄 Criando backup do banco de dados...")
    if not create_backup():
        print("❌ Falha ao criar backup. Abortando.")
        return
    
    print()
    
    # 2. Identificar registros corrompidos
    corrupted_records = identify_corrupted_records()
    
    total_issues = sum(len(records) for records in corrupted_records.values())
    
    if total_issues == 0:
        print("✅ Nenhum registro com caracteres corrompidos encontrado!")
        return
    
    print(f"📊 Resumo dos problemas encontrados:")
    for model_name, records in corrupted_records.items():
        if records:
            print(f"  - {model_name}: {len(records)} registro(s)")
    print()
    
    # 3. Simulação (dry run)
    print("🧪 SIMULAÇÃO (Dry Run):")
    simulated_fixes = fix_corrupted_data(corrupted_records, dry_run=True)
    print(f"   Registros que seriam corrigidos: {simulated_fixes}")
    print()
    
    # 4. Aplicar correções baseado nos argumentos
    if simulated_fixes > 0:
        should_apply = False
        
        if args.dry_run:
            print("🧪 Modo dry-run ativo - nenhuma alteração será aplicada")
        elif args.force:
            print("🚀 Modo force ativo - aplicando correções automaticamente")
            should_apply = True
        else:
            response = input(f"🤔 Deseja aplicar as correções em {simulated_fixes} registro(s)? (s/N): ")
            should_apply = response.lower() == 's'
        
        if should_apply:
            print()
            print("🚀 APLICANDO CORREÇÕES:")
            actual_fixes = fix_corrupted_data(corrupted_records, dry_run=False)
            print(f"✅ {actual_fixes} registro(s) corrigido(s) com sucesso!")
            
            # Verificação final
            print()
            print("🔍 Verificação final...")
            final_check = identify_corrupted_records()
            remaining_issues = sum(len(records) for records in final_check.values())
            
            if remaining_issues == 0:
                print("✅ Todos os problemas de encoding foram corrigidos!")
            else:
                print(f"⚠️  Ainda restam {remaining_issues} problema(s) - pode ser necessária correção manual")
        elif not args.dry_run:
            print("❌ Correções canceladas pelo usuário")
    else:
        print("ℹ️  Nenhuma correção necessária")
    
    print()
    print("=== FIM DA CORREÇÃO ===")

if __name__ == '__main__':
    main()