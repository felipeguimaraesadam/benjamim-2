#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.models import Obra, Material

print("=== BUSCANDO DADOS PARA TESTES ===")

# Buscar obras
print("\n📋 OBRAS DISPONÍVEIS:")
obras = Obra.objects.all()[:5]
if obras.exists():
    for obra in obras:
        # Verificar quais campos existem no modelo Obra
        print(f"ID: {obra.id}")
        if hasattr(obra, 'nome'):
            print(f"  Nome: {obra.nome}")
        if hasattr(obra, 'descricao'):
            print(f"  Descrição: {obra.descricao}")
        if hasattr(obra, 'endereco'):
            print(f"  Endereço: {obra.endereco}")
        if hasattr(obra, 'cliente_nome'):
            print(f"  Cliente: {obra.cliente_nome}")
        print("---")
else:
    print("❌ Nenhuma obra encontrada")
    # Criar uma obra de teste
    print("🔧 Criando obra de teste...")
    try:
        obra_teste = Obra.objects.create(
            endereco="Rua Teste, 123",
            cidade="Cidade Teste",
            status="EM_ANDAMENTO",
            cliente_nome="Cliente Teste",
            orcamento_previsto=50000.00
        )
        print(f"✅ Obra de teste criada com ID: {obra_teste.id}")
    except Exception as e:
        print(f"❌ Erro ao criar obra: {e}")

# Buscar materiais
print("\n📦 MATERIAIS DISPONÍVEIS:")
materiais = Material.objects.all()[:5]
if materiais.exists():
    for material in materiais:
        print(f"ID: {material.id}")
        if hasattr(material, 'nome'):
            print(f"  Nome: {material.nome}")
        if hasattr(material, 'categoria'):
            print(f"  Categoria: {material.categoria}")
        if hasattr(material, 'unidade'):
            print(f"  Unidade: {material.unidade}")
        print("---")
else:
    print("❌ Nenhum material encontrado")
    # Criar um material de teste
    print("🔧 Criando material de teste...")
    try:
        material_teste = Material.objects.create(
            nome="Cimento Portland",
            categoria="CIMENTO",
            unidade="SC"
        )
        print(f"✅ Material de teste criado com ID: {material_teste.id}")
    except Exception as e:
        print(f"❌ Erro ao criar material: {e}")

# Verificar categorias de uso válidas
print("\n🏷️ VERIFICANDO CATEGORIAS DE USO:")
try:
    from core.models import ItemCompra
    # Tentar encontrar as opções válidas para categoria_uso
    if hasattr(ItemCompra, '_meta'):
        for field in ItemCompra._meta.fields:
            if field.name == 'categoria_uso' and hasattr(field, 'choices'):
                print("Categorias válidas para categoria_uso:")
                for choice in field.choices:
                    print(f"  - {choice[0]}: {choice[1]}")
                break
        else:
            print("Campo categoria_uso não encontrado ou sem choices")
except Exception as e:
    print(f"Erro ao verificar categorias: {e}")

print("\n🎯 DADOS FINAIS PARA TESTE:")
obra_final = Obra.objects.first()
material_final = Material.objects.first()

if obra_final:
    print(f"Obra ID para teste: {obra_final.id}")
else:
    print("❌ Nenhuma obra disponível")

if material_final:
    print(f"Material ID para teste: {material_final.id}")
else:
    print("❌ Nenhum material disponível")