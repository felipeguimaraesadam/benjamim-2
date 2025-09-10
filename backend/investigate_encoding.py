#!/usr/bin/env python
import os
import django
import sqlite3

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.models import Obra, Compra, ItemCompra

def investigate_encoding_issues():
    print("=== INVESTIGAÇÃO DE PROBLEMAS DE ENCODING ===")
    print()
    
    # 1. Verificar configuração do banco
    print("1. CONFIGURAÇÃO DO BANCO:")
    from django.conf import settings
    db_config = settings.DATABASES['default']
    print(f"   Engine: {db_config['ENGINE']}")
    print(f"   Name: {db_config['NAME']}")
    print()
    
    # 2. Verificar se estamos usando SQLite local
    if 'sqlite' in db_config['ENGINE']:
        print("   ✅ Usando SQLite LOCAL")
        db_path = db_config['NAME']
        if os.path.exists(db_path):
            size = os.path.getsize(db_path)
            print(f"   📁 Arquivo: {db_path} ({size} bytes)")
        else:
            print(f"   ❌ Arquivo não encontrado: {db_path}")
    else:
        print(f"   🌐 Usando banco remoto: {db_config['NAME']}")
    print()
    
    # Verificar dados com caracteres estranhos
    print("\n=== VERIFICAÇÃO DE DADOS COM CARACTERES ESTRANHOS ===")
    obras = Obra.objects.all()
    print(f"Total de obras encontradas: {obras.count()}")
    
    for obra in obras[:5]:  # Primeiras 5 obras
        print(f"\nObra ID {obra.id}:")
        print(f"  Nome: {repr(obra.nome_obra)}")
        print(f"  Endereço: {repr(obra.endereco_completo)}")
        print(f"  Cidade: {repr(obra.cidade)}")
        
        # Verificar se há caracteres suspeitos
        if '▓' in obra.nome_obra or '▓' in obra.endereco_completo or '▓' in obra.cidade:
            print(f"  ⚠️  PROBLEMA DE ENCODING DETECTADO!")
            print(f"  Nome bytes: {obra.nome_obra.encode('utf-8', errors='replace')}")
            print(f"  Endereço bytes: {obra.endereco_completo.encode('utf-8', errors='replace')}")
            print(f"  Cidade bytes: {obra.cidade.encode('utf-8', errors='replace')}")
        
        # Verificar área (m²)
        if hasattr(obra, 'area_metragem') and obra.area_metragem:
            print(f"  Área: {obra.area_metragem} m²")
    
    # 3. Verificar dados com problemas de encoding
    print("2. PROBLEMAS DE ENCODING ENCONTRADOS:")
    
    # Verificar obras com caracteres estranhos
    obras_problemas = []
    for obra in Obra.objects.all()[:10]:  # Limitar a 10 para não sobrecarregar
        campos_problema = []
        
        # Verificar nome
        if obra.nome_obra and ('▓' in obra.nome_obra or '�' in obra.nome_obra):
            campos_problema.append(f"nome: '{obra.nome_obra}'")
            
        # Verificar endereço
        if obra.endereco_completo and ('▓' in obra.endereco_completo or '�' in obra.endereco_completo):
            campos_problema.append(f"endereço: '{obra.endereco_completo}'")
            
        # Verificar cidade
        if obra.cidade and ('▓' in obra.cidade or '�' in obra.cidade):
            campos_problema.append(f"cidade: '{obra.cidade}'")
            
        if campos_problema:
            obras_problemas.append({
                'id': obra.id,
                'problemas': campos_problema
            })
    
    if obras_problemas:
        print("   ❌ Obras com problemas de encoding:")
        for obra in obras_problemas:
            print(f"      Obra ID {obra['id']}: {', '.join(obra['problemas'])}")
    else:
        print("   ✅ Nenhum problema de encoding encontrado nas obras")
    print()
    
    # Verificar compras com problemas
    compras_problemas = []
    for compra in Compra.objects.all()[:10]:
        campos_problema = []
        
        # Verificar fornecedor
        if compra.fornecedor and ('▓' in compra.fornecedor or '�' in compra.fornecedor):
            campos_problema.append(f"fornecedor: '{compra.fornecedor}'")
            
        # Verificar observações
        if compra.observacoes and ('▓' in compra.observacoes or '�' in compra.observacoes):
            campos_problema.append(f"observações: '{compra.observacoes}'")
            
        if campos_problema:
            compras_problemas.append({
                'id': compra.id,
                'problemas': campos_problema
            })
    
    if compras_problemas:
        print("   ❌ Compras com problemas de encoding:")
        for compra in compras_problemas:
            print(f"      Compra ID {compra['id']}: {', '.join(compra['problemas'])}")
    else:
        print("   ✅ Nenhum problema de encoding encontrado nas compras")
    print()
    
    # Verificar materiais com problemas
    from core.models import Material
    materiais_problemas = []
    for material in Material.objects.all()[:20]:
        campos_problema = []
        
        # Verificar nome do material
        if material.nome and ('▓' in material.nome or '�' in material.nome):
            campos_problema.append(f"nome: '{material.nome}'")
            
        # Verificar unidade de medida
        if material.unidade_medida and ('▓' in material.unidade_medida or '�' in material.unidade_medida):
            campos_problema.append(f"unidade: '{material.unidade_medida}'")
            
        if campos_problema:
            materiais_problemas.append({
                'id': material.id,
                'problemas': campos_problema
            })
    
    if materiais_problemas:
        print("   ❌ Materiais com problemas de encoding:")
        for material in materiais_problemas:
            print(f"      Material ID {material['id']}: {', '.join(material['problemas'])}")
    else:
        print("   ✅ Nenhum problema de encoding encontrado nos materiais")
    print()
    
    # 4. Verificar configuração de charset do Django
    print("3. CONFIGURAÇÃO DE CHARSET:")
    print(f"   LANGUAGE_CODE: {settings.LANGUAGE_CODE}")
    print(f"   USE_I18N: {settings.USE_I18N}")
    print(f"   TIME_ZONE: {settings.TIME_ZONE}")
    print()
    
    # 5. Estatísticas gerais
    print("4. ESTATÍSTICAS:")
    print(f"   Total de obras: {Obra.objects.count()}")
    print(f"   Total de compras: {Compra.objects.count()}")
    print(f"   Total de itens: {ItemCompra.objects.count()}")
    print()
    
    print("=== FIM DA INVESTIGAÇÃO ===")

if __name__ == '__main__':
    investigate_encoding_issues()