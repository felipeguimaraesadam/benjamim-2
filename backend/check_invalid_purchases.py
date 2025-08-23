from core.models import Compra, ItemCompra

print("=== VERIFICANDO COMPRAS SEM ITENS ===")

compras_sem_itens = []
for compra in Compra.objects.all():
    if not ItemCompra.objects.filter(compra=compra).exists():
        compras_sem_itens.append(compra)

print(f"Encontradas {len(compras_sem_itens)} compras sem itens:")
for compra in compras_sem_itens:
    print(f"ID: {compra.id}, Fornecedor: {compra.fornecedor}, Data: {compra.data_compra}, NF: {compra.nota_fiscal}")

if compras_sem_itens:
    print("\n=== REMOVENDO COMPRAS INVÁLIDAS ===")
    for compra in compras_sem_itens:
        print(f"Removendo compra ID {compra.id} - {compra.fornecedor}")
        compra.delete()
    print(f"Removidas {len(compras_sem_itens)} compras inválidas.")
else:
    print("\nNenhuma compra inválida encontrada.")