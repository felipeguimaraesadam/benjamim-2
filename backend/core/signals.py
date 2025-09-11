from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Sum
from decimal import Decimal
from .models import ItemCompra, Compra


@receiver(post_save, sender=ItemCompra)
def update_compra_totals_on_item_save(sender, instance, **kwargs):
    """
    Atualiza os valores totais da compra quando um item é criado ou atualizado
    """
    compra = instance.compra
    
    # Recalcular valor_total_bruto baseado nos itens
    total_bruto = compra.itens.aggregate(
        total=Sum('valor_total_item')
    )['total'] or Decimal('0.00')
    
    # Atualizar os valores da compra
    compra.valor_total_bruto = total_bruto
    compra.valor_total_liquido = total_bruto - compra.desconto
    
    # Salvar a compra sem chamar os signals novamente para evitar recursão
    Compra.objects.filter(id=compra.id).update(
        valor_total_bruto=total_bruto,
        valor_total_liquido=total_bruto - compra.desconto
    )


@receiver(post_delete, sender=ItemCompra)
def update_compra_totals_on_item_delete(sender, instance, **kwargs):
    """
    Atualiza os valores totais da compra quando um item é deletado
    """
    compra = instance.compra
    
    # Recalcular valor_total_bruto baseado nos itens restantes
    total_bruto = compra.itens.aggregate(
        total=Sum('valor_total_item')
    )['total'] or Decimal('0.00')
    
    # Atualizar os valores da compra
    compra.valor_total_bruto = total_bruto
    compra.valor_total_liquido = total_bruto - compra.desconto
    
    # Salvar a compra sem chamar os signals novamente para evitar recursão
    Compra.objects.filter(id=compra.id).update(
        valor_total_bruto=total_bruto,
        valor_total_liquido=total_bruto - compra.desconto
    )