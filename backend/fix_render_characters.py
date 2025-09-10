#!/usr/bin/env python3
"""
Script para corrigir caracteres corrompidos no banco de dados do Render.
Este script é otimizado para execução no ambiente de produção do Render.

Uso:
  python fix_render_characters.py --dry-run    # Simular correções
  python fix_render_characters.py --apply      # Aplicar correções
"""

import os
import sys
import django
import argparse
from datetime import datetime

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from django.db import transaction
from core.models import Material, Compra, ItemCompra, ParcelaCompra

def get_character_mapping():
    """Mapeamento de caracteres corrompidos para corretos"""
    return {
        '▓': '²',  # Metro quadrado
        '³': '³',  # Metro cúbico (caso apareça corrompido)
        '°': '°',  # Grau
        'º': 'º',  # Ordinal masculino
        'ª': 'ª',  # Ordinal feminino
        '¹': '¹',  # Sobrescrito 1
        '²': '²',  # Sobrescrito 2 (caso apareça corrompido)
        '½': '½',  # Um meio
        '¼': '¼',  # Um quarto
        '¾': '¾',  # Três quartos
        'µ': 'µ',  # Micro
        'Ω': 'Ω',  # Ohm
        'α': 'α',  # Alpha
        'β': 'β',  # Beta
        'γ': 'γ',  # Gamma
        'δ': 'δ',  # Delta
        'π': 'π',  # Pi
        '∞': '∞',  # Infinito
        '±': '±',  # Mais ou menos
        '×': '×',  # Multiplicação
        '÷': '÷',  # Divisão
        '≤': '≤',  # Menor ou igual
        '≥': '≥',  # Maior ou igual
        '≠': '≠',  # Diferente
        '≈': '≈',  # Aproximadamente igual
        '√': '√',  # Raiz quadrada
        '∑': '∑',  # Somatório
        '∆': '∆',  # Delta maiúsculo
        '∇': '∇',  # Nabla
        '∂': '∂',  # Derivada parcial
        '∫': '∫',  # Integral
        '∴': '∴',  # Portanto
        '∵': '∵',  # Porque
        '∈': '∈',  # Pertence
        '∉': '∉',  # Não pertence
        '∪': '∪',  # União
        '∩': '∩',  # Interseção
        '⊂': '⊂',  # Subconjunto
        '⊃': '⊃',  # Superconjunto
        '⊆': '⊆',  # Subconjunto ou igual
        '⊇': '⊇',  # Superconjunto ou igual
        '⊕': '⊕',  # XOR
        '⊗': '⊗',  # Produto tensorial
        '⊥': '⊥',  # Perpendicular
        '∥': '∥',  # Paralelo
        '∠': '∠',  # Ângulo
        '∡': '∡',  # Ângulo medido
        '∢': '∢',  # Ângulo esférico
        '∣': '∣',  # Divide
        '∤': '∤',  # Não divide
        '∝': '∝',  # Proporcional
        '∞': '∞',  # Infinito
        '∟': '∟',  # Ângulo reto
        '∠': '∠',  # Ângulo
        '∡': '∡',  # Ângulo medido
        '∢': '∢',  # Ângulo esférico
        '∣': '∣',  # Divide
        '∤': '∤',  # Não divide
        '∥': '∥',  # Paralelo
        '∦': '∦',  # Não paralelo
        '∧': '∧',  # E lógico
        '∨': '∨',  # Ou lógico
        '∩': '∩',  # Interseção
        '∪': '∪',  # União
        '∫': '∫',  # Integral
        '∮': '∮',  # Integral de contorno
        '∯': '∯',  # Integral de superfície
        '∰': '∰',  # Integral de volume
        '∱': '∱',  # Integral no sentido horário
        '∲': '∲',  # Integral no sentido anti-horário
        '∳': '∳',  # Integral no sentido anti-horário
        '∴': '∴',  # Portanto
        '∵': '∵',  # Porque
        '∶': '∶',  # Razão
        '∷': '∷',  # Proporção
        '∸': '∸',  # Menos pontilhado
        '∹': '∹',  # Excesso
        '∺': '∺',  # Proporção geométrica
        '∻': '∻',  # Homotetico
        '∼': '∼',  # Similar
        '∽': '∽',  # Similar invertido
        '∾': '∾',  # Similar ou igual invertido
        '∿': '∿',  # Onda senoidal
        '≀': '≀',  # Produto coroa
        '≁': '≁',  # Não similar
        '≂': '≂',  # Menos similar
        '≃': '≃',  # Assintoticamente igual
        '≄': '≄',  # Não assintoticamente igual
        '≅': '≅',  # Aproximadamente igual
        '≆': '≆',  # Aproximadamente mas não igual
        '≇': '≇',  # Nem aproximadamente nem igual
        '≈': '≈',  # Quase igual
        '≉': '≉',  # Não quase igual
        '≊': '≊',  # Quase igual ou igual
        '≋': '≋',  # Triplo til
        '≌': '≌',  # Tudo igual
        '≍': '≍',  # Equivalente
        '≎': '≎',  # Geometricamente equivalente
        '≏': '≏',  # Diferença entre
        '≐': '≐',  # Aproxima-se do limite
        '≑': '≑',  # Geometricamente igual
        '≒': '≒',  # Aproximadamente igual ou imagem de
        '≓': '≓',  # Imagem de ou aproximadamente igual
        '≔': '≔',  # Dois pontos igual
        '≕': '≕',  # Igual dois pontos
        '≖': '≖',  # Anel em igual
        '≗': '≗',  # Anel igual
        '≘': '≘',  # Corresponde
        '≙': '≙',  # Estimativas
        '≚': '≚',  # Equiangular
        '≛': '≛',  # Estrela igual
        '≜': '≜',  # Delta igual
        '≝': '≝',  # Igual por definição
        '≞': '≞',  # Medido por
        '≟': '≟',  # Questionado igual
        '≠': '≠',  # Não igual
        '≡': '≡',  # Idêntico
        '≢': '≢',  # Não idêntico
        '≣': '≣',  # Estritamente equivalente
        '≤': '≤',  # Menor ou igual
        '≥': '≥',  # Maior ou igual
        '≦': '≦',  # Menor sobre igual
        '≧': '≧',  # Maior sobre igual
        '≨': '≨',  # Menor mas não igual
        '≩': '≩',  # Maior mas não igual
        '≪': '≪',  # Muito menor
        '≫': '≫',  # Muito maior
        '≬': '≬',  # Entre
        '≭': '≭',  # Não equivalente
        '≮': '≮',  # Não menor
        '≯': '≯',  # Não maior
        '≰': '≰',  # Nem menor nem igual
        '≱': '≱',  # Nem maior nem igual
        '≲': '≲',  # Menor ou equivalente
        '≳': '≳',  # Maior ou equivalente
        '≴': '≴',  # Nem menor nem equivalente
        '≵': '≵',  # Nem maior nem equivalente
        '≶': '≶',  # Menor ou maior
        '≷': '≷',  # Maior ou menor
        '≸': '≸',  # Nem menor nem maior
        '≹': '≹',  # Nem maior nem menor
        '≺': '≺',  # Precede
        '≻': '≻',  # Sucede
        '≼': '≼',  # Precede ou igual
        '≽': '≽',  # Sucede ou igual
        '≾': '≾',  # Precede ou equivalente
        '≿': '≿',  # Sucede ou equivalente
        '⊀': '⊀',  # Não precede
        '⊁': '⊁',  # Não sucede
        '⊂': '⊂',  # Subconjunto
        '⊃': '⊃',  # Superconjunto
        '⊄': '⊄',  # Não subconjunto
        '⊅': '⊅',  # Não superconjunto
        '⊆': '⊆',  # Subconjunto ou igual
        '⊇': '⊇',  # Superconjunto ou igual
        '⊈': '⊈',  # Nem subconjunto nem igual
        '⊉': '⊉',  # Nem superconjunto nem igual
        '⊊': '⊊',  # Subconjunto com não igual
        '⊋': '⊋',  # Superconjunto com não igual
        '⊌': '⊌',  # Multiconjunto
        '⊍': '⊍',  # Multiplicação de multiconjunto
        '⊎': '⊎',  # União de multiconjunto
        '⊏': '⊏',  # Imagem quadrada de
        '⊐': '⊐',  # Imagem quadrada original de
        '⊑': '⊑',  # Imagem quadrada de ou igual
        '⊒': '⊒',  # Imagem quadrada original de ou igual
        '⊓': '⊓',  # Quadrado cap
        '⊔': '⊔',  # Quadrado cup
        '⊕': '⊕',  # Mais circulado
        '⊖': '⊖',  # Menos circulado
        '⊗': '⊗',  # Vezes circulado
        '⊘': '⊘',  # Barra circulada
        '⊙': '⊙',  # Operador circulado ponto
        '⊚': '⊚',  # Operador circulado anel
        '⊛': '⊛',  # Operador circulado asterisco
        '⊜': '⊜',  # Operador circulado igual
        '⊝': '⊝',  # Operador circulado traço
        '⊞': '⊞',  # Mais quadrado
        '⊟': '⊟',  # Menos quadrado
        '⊠': '⊠',  # Vezes quadrado
        '⊡': '⊡',  # Ponto quadrado
        '⊢': '⊢',  # Tack direito
        '⊣': '⊣',  # Tack esquerdo
        '⊤': '⊤',  # Tack para baixo
        '⊥': '⊥',  # Tack para cima
        '⊦': '⊦',  # Afirmação
        '⊧': '⊧',  # Modelos
        '⊨': '⊨',  # Verdadeiro
        '⊩': '⊩',  # Força
        '⊪': '⊪',  # Força tripla turnstile vertical
        '⊫': '⊫',  # Força dupla turnstile vertical
        '⊬': '⊬',  # Não prova
        '⊭': '⊭',  # Não verdadeiro
        '⊮': '⊮',  # Não força
        '⊯': '⊯',  # Força negada dupla turnstile vertical
        '⊰': '⊰',  # Precede sob relação
        '⊱': '⊱',  # Sucede sob relação
        '⊲': '⊲',  # Triângulo esquerdo normal subgrupo
        '⊳': '⊳',  # Triângulo direito normal subgrupo
        '⊴': '⊴',  # Triângulo esquerdo normal subgrupo ou igual
        '⊵': '⊵',  # Triângulo direito normal subgrupo ou igual
        '⊶': '⊶',  # Triângulo esquerdo original de
        '⊷': '⊷',  # Triângulo direito original de
        '⊸': '⊸',  # Multimap
        '⊹': '⊹',  # Hermitiano conjugado matriz
        '⊺': '⊺',  # Intercalação
        '⊻': '⊻',  # Xor
        '⊼': '⊼',  # Nand
        '⊽': '⊽',  # Nor
        '⊾': '⊾',  # Ângulo direito com arco
        '⊿': '⊿',  # Triângulo direito
        '⋀': '⋀',  # N-ary lógico e
        '⋁': '⋁',  # N-ary lógico ou
        '⋂': '⋂',  # N-ary interseção
        '⋃': '⋃',  # N-ary união
        '⋄': '⋄',  # Operador diamante
        '⋅': '⋅',  # Operador ponto
        '⋆': '⋆',  # Operador estrela
        '⋇': '⋇',  # Divisão vezes
        '⋈': '⋈',  # Bowtie
        '⋉': '⋉',  # Semijunção esquerda normal
        '⋊': '⋊',  # Semijunção direita normal
        '⋋': '⋋',  # Semijunção esquerda
        '⋌': '⋌',  # Semijunção direita
        '⋍': '⋍',  # Curly lógico ou
        '⋎': '⋎',  # Curly lógico e
        '⋏': '⋏',  # Multiconjunto multiplicação
        '⋐': '⋐',  # Duplo subconjunto
        '⋑': '⋑',  # Duplo superconjunto
        '⋒': '⋒',  # Dupla interseção
        '⋓': '⋓',  # Dupla união
        '⋔': '⋔',  # Pitchfork
        '⋕': '⋕',  # Igual e paralelo
        '⋖': '⋖',  # Menor com ponto
        '⋗': '⋗',  # Maior com ponto
        '⋘': '⋘',  # Muito menor
        '⋙': '⋙',  # Muito maior
        '⋚': '⋚',  # Menor igual maior
        '⋛': '⋛',  # Maior igual menor
        '⋜': '⋜',  # Igual ou menor
        '⋝': '⋝',  # Igual ou maior
        '⋞': '⋞',  # Igual ou precede
        '⋟': '⋟',  # Igual ou sucede
        '⋠': '⋠',  # Não precede ou igual
        '⋡': '⋡',  # Não sucede ou igual
        '⋢': '⋢',  # Não imagem quadrada de ou igual
        '⋣': '⋣',  # Não imagem quadrada original de ou igual
        '⋤': '⋤',  # Quadrado imagem de ou não igual
        '⋥': '⋥',  # Quadrado original de ou não igual
        '⋦': '⋦',  # Menor sobre não igual
        '⋧': '⋧',  # Maior sobre não igual
        '⋨': '⋨',  # Precede sobre não igual
        '⋩': '⋩',  # Sucede sobre não igual
        '⋪': '⋪',  # Triângulo esquerdo com não igual
        '⋫': '⋫',  # Triângulo direito com não igual
        '⋬': '⋬',  # Triângulo esquerdo original de com não igual
        '⋭': '⋭',  # Triângulo direito original de com não igual
        '⋮': '⋮',  # Elipse vertical
        '⋯': '⋯',  # Elipse horizontal média
        '⋰': '⋰',  # Elipse diagonal para cima direita
        '⋱': '⋱',  # Elipse diagonal para baixo direita
        '⋲': '⋲',  # Elemento de com linha longa horizontal
        '⋳': '⋳',  # Elemento de com linha vertical final
        '⋴': '⋴',  # Pequeno elemento de com linha vertical sobrescrita
        '⋵': '⋵',  # Elemento de com ponto acima
        '⋶': '⋶',  # Elemento de com barra sobrescrita
        '⋷': '⋷',  # Pequeno elemento de com barra sobrescrita
        '⋸': '⋸',  # Elemento de com sublinhado
        '⋹': '⋹',  # Elemento de com dois sublinhados horizontais
        '⋺': '⋺',  # Contém com linha longa horizontal
        '⋻': '⋻',  # Contém com linha vertical final
        '⋼': '⋼',  # Pequeno contém com linha vertical sobrescrita
        '⋽': '⋽',  # Contém com barra sobrescrita
        '⋾': '⋾',  # Pequeno contém com barra sobrescrita
        '⋿': '⋿',  # Z notação saco membro
    }

def has_corrupted_characters(text, char_mapping):
    """Verifica se o texto contém caracteres corrompidos"""
    if not text:
        return False
    return any(char in text for char in char_mapping.keys())

def fix_corrupted_text(text, char_mapping):
    """Corrige caracteres corrompidos no texto"""
    if not text:
        return text
    
    fixed_text = text
    for corrupted, correct in char_mapping.items():
        fixed_text = fixed_text.replace(corrupted, correct)
    
    return fixed_text

def find_corrupted_records():
    """Encontra todos os registros com caracteres corrompidos"""
    char_mapping = get_character_mapping()
    corrupted_records = {
        'materials': [],
        'compras': [],
        'item_compras': [],
        'parcela_compras': []
    }
    
    # Verificar Materials
    for material in Material.objects.all():
        issues = []
        if has_corrupted_characters(material.nome, char_mapping):
            issues.append(('nome', material.nome))
        if has_corrupted_characters(material.unidade_medida, char_mapping):
            issues.append(('unidade_medida', material.unidade_medida))
        
        if issues:
            corrupted_records['materials'].append({
                'id': material.id,
                'issues': issues
            })
    
    # Verificar Compras
    for compra in Compra.objects.all():
        issues = []
        if has_corrupted_characters(compra.fornecedor, char_mapping):
            issues.append(('fornecedor', compra.fornecedor))
        if has_corrupted_characters(compra.nota_fiscal, char_mapping):
            issues.append(('nota_fiscal', compra.nota_fiscal))
        if has_corrupted_characters(compra.observacoes, char_mapping):
            issues.append(('observacoes', compra.observacoes))
        
        if issues:
            corrupted_records['compras'].append({
                'id': compra.id,
                'issues': issues
            })
    
    # Verificar ItemCompras
    for item in ItemCompra.objects.all():
        issues = []
        if hasattr(item, 'descricao') and has_corrupted_characters(item.descricao, char_mapping):
            issues.append(('descricao', item.descricao))
        
        if issues:
            corrupted_records['item_compras'].append({
                'id': item.id,
                'issues': issues
            })
    
    # Verificar ParcelaCompras
    for parcela in ParcelaCompra.objects.all():
        issues = []
        if hasattr(parcela, 'observacoes') and has_corrupted_characters(parcela.observacoes, char_mapping):
            issues.append(('observacoes', parcela.observacoes))
        
        if issues:
            corrupted_records['parcela_compras'].append({
                'id': parcela.id,
                'issues': issues
            })
    
    return corrupted_records

def simulate_fixes(corrupted_records):
    """Simula as correções e mostra o que seria alterado"""
    char_mapping = get_character_mapping()
    total_fixes = 0
    
    print("🧪 SIMULAÇÃO (Dry Run):")
    print("🔧 Simulando correções...")
    
    # Materials
    for record in corrupted_records['materials']:
        material = Material.objects.get(id=record['id'])
        for field, old_value in record['issues']:
            new_value = fix_corrupted_text(old_value, char_mapping)
            print(f"  📦 Material ID {material.id}: {field}: '{old_value}' → '{new_value}'")
            total_fixes += 1
    
    # Compras
    for record in corrupted_records['compras']:
        compra = Compra.objects.get(id=record['id'])
        for field, old_value in record['issues']:
            new_value = fix_corrupted_text(old_value, char_mapping)
            print(f"  🛒 Compra ID {compra.id}: {field}: '{old_value}' → '{new_value}'")
            total_fixes += 1
    
    # ItemCompras
    for record in corrupted_records['item_compras']:
        item = ItemCompra.objects.get(id=record['id'])
        for field, old_value in record['issues']:
            new_value = fix_corrupted_text(old_value, char_mapping)
            print(f"  📋 ItemCompra ID {item.id}: {field}: '{old_value}' → '{new_value}'")
            total_fixes += 1
    
    # ParcelaCompras
    for record in corrupted_records['parcela_compras']:
        parcela = ParcelaCompra.objects.get(id=record['id'])
        for field, old_value in record['issues']:
            new_value = fix_corrupted_text(old_value, char_mapping)
            print(f"  💰 ParcelaCompra ID {parcela.id}: {field}: '{old_value}' → '{new_value}'")
            total_fixes += 1
    
    print(f"   Registros que seriam corrigidos: {total_fixes}")
    return total_fixes

def apply_fixes(corrupted_records):
    """Aplica as correções no banco de dados"""
    char_mapping = get_character_mapping()
    total_fixes = 0
    
    try:
        with transaction.atomic():
            # Materials
            for record in corrupted_records['materials']:
                material = Material.objects.get(id=record['id'])
                for field, old_value in record['issues']:
                    new_value = fix_corrupted_text(old_value, char_mapping)
                    setattr(material, field, new_value)
                    print(f"  ✅ Material ID {material.id}: {field} corrigido")
                    total_fixes += 1
                material.save()
            
            # Compras
            for record in corrupted_records['compras']:
                compra = Compra.objects.get(id=record['id'])
                for field, old_value in record['issues']:
                    new_value = fix_corrupted_text(old_value, char_mapping)
                    setattr(compra, field, new_value)
                    print(f"  ✅ Compra ID {compra.id}: {field} corrigido")
                    total_fixes += 1
                compra.save()
            
            # ItemCompras
            for record in corrupted_records['item_compras']:
                item = ItemCompra.objects.get(id=record['id'])
                for field, old_value in record['issues']:
                    new_value = fix_corrupted_text(old_value, char_mapping)
                    setattr(item, field, new_value)
                    print(f"  ✅ ItemCompra ID {item.id}: {field} corrigido")
                    total_fixes += 1
                item.save()
            
            # ParcelaCompras
            for record in corrupted_records['parcela_compras']:
                parcela = ParcelaCompra.objects.get(id=record['id'])
                for field, old_value in record['issues']:
                    new_value = fix_corrupted_text(old_value, char_mapping)
                    setattr(parcela, field, new_value)
                    print(f"  ✅ ParcelaCompra ID {parcela.id}: {field} corrigido")
                    total_fixes += 1
                parcela.save()
            
            print(f"\n✅ {total_fixes} correção(ões) aplicada(s) com sucesso!")
            return total_fixes
            
    except Exception as e:
        print(f"❌ Erro ao aplicar correções: {e}")
        return 0

def main():
    parser = argparse.ArgumentParser(description='Corrige caracteres corrompidos no banco do Render')
    parser.add_argument('--dry-run', action='store_true', help='Simula as correções sem aplicá-las')
    parser.add_argument('--apply', action='store_true', help='Aplica as correções no banco')
    args = parser.parse_args()
    
    if not args.dry_run and not args.apply:
        print("❌ Especifique --dry-run ou --apply")
        print("\nUso:")
        print("  python fix_render_characters.py --dry-run    # Simular")
        print("  python fix_render_characters.py --apply      # Aplicar")
        return
    
    print("=== CORREÇÃO DE CARACTERES - RENDER ===")
    print()
    
    # Verificar ambiente
    from django.conf import settings
    db_config = settings.DATABASES['default']
    if 'postgresql' in db_config['ENGINE']:
        print("🗄️  Banco: PostgreSQL (Render)")
        if args.apply:
            print("⚠️  EXECUTANDO EM PRODUÇÃO!")
    else:
        print("🗄️  Banco: SQLite (Local)")
    
    print()
    
    # Encontrar registros corrompidos
    print("🔍 Identificando registros com caracteres corrompidos...")
    corrupted_records = find_corrupted_records()
    
    # Resumo
    total_records = sum(len(records) for records in corrupted_records.values())
    if total_records == 0:
        print("✅ Nenhum registro com caracteres corrompidos encontrado!")
        return
    
    print("📊 Resumo dos problemas encontrados:")
    for table, records in corrupted_records.items():
        if records:
            print(f"  - {table}: {len(records)} registro(s)")
    
    print()
    
    if args.dry_run:
        # Simular correções
        simulate_fixes(corrupted_records)
        print("\n🧪 Simulação concluída - nenhuma alteração foi feita")
    
    elif args.apply:
        # Aplicar correções
        print("🚀 APLICANDO CORREÇÕES:")
        fixes_applied = apply_fixes(corrupted_records)
        
        if fixes_applied > 0:
            # Verificar se ainda há problemas
            remaining_corrupted = find_corrupted_records()
            remaining_total = sum(len(records) for records in remaining_corrupted.values())
            
            if remaining_total == 0:
                print("\n🎉 Todas as correções foram aplicadas com sucesso!")
            else:
                print(f"\n⚠️  Ainda restam {remaining_total} problema(s) - pode ser necessária correção manual")
        else:
            print("\n❌ Nenhuma correção foi aplicada")
    
    print("\n=== FIM DA CORREÇÃO ===")

if __name__ == '__main__':
    main()