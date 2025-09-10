#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.models import Material

def fix_encoding_issues():
    """Corrige problemas de encoding nos dados do banco"""
    print("🔧 Iniciando correção de problemas de encoding...")
    
    # Buscar materiais com caracteres corrompidos
    materiais_corrompidos = Material.objects.filter(
        unidade_medida__contains='▓'
    )
    
    print(f"📊 Encontrados {materiais_corrompidos.count()} materiais com problemas de encoding")
    
    corrections_made = 0
    
    for material in materiais_corrompidos:
        old_unidade = material.unidade_medida
        
        # Correções conhecidas
        new_unidade = old_unidade
        if 'm▓' in old_unidade:
            new_unidade = old_unidade.replace('m▓', 'm²')
            corrections_made += 1
        
        if 'M▓' in old_unidade:
            new_unidade = old_unidade.replace('M▓', 'M²')
            corrections_made += 1
            
        if new_unidade != old_unidade:
            material.unidade_medida = new_unidade
            material.save()
            print(f"✅ Corrigido: '{old_unidade}' → '{new_unidade}' (Material: {material.nome})")
    
    print(f"\n🎉 Correção concluída! {corrections_made} correções realizadas.")
    
    # Verificar se ainda há problemas
    remaining_issues = Material.objects.filter(
        unidade_medida__contains='▓'
    ).count()
    
    if remaining_issues > 0:
        print(f"⚠️  Ainda restam {remaining_issues} materiais com problemas de encoding")
        print("\n📋 Materiais restantes com problemas:")
        for material in Material.objects.filter(unidade_medida__contains='▓')[:5]:
            print(f"  - {material.nome}: '{material.unidade_medida}'")
    else:
        print("✅ Todos os problemas de encoding foram corrigidos!")

if __name__ == '__main__':
    fix_encoding_issues()