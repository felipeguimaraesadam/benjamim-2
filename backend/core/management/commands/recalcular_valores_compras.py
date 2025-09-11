from django.core.management.base import BaseCommand
from django.db.models import Sum
from decimal import Decimal
from core.models import Compra, ItemCompra

class Command(BaseCommand):
    help = 'Recalcula os valores totais das compras que estão zeradas incorretamente'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Apenas mostra quais compras seriam atualizadas sem fazer alterações',
        )
        parser.add_argument(
            '--compra-id',
            type=int,
            help='Recalcula apenas uma compra específica pelo ID',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        compra_id = options.get('compra_id')
        
        if compra_id:
            # Recalcular apenas uma compra específica
            try:
                compra = Compra.objects.get(id=compra_id)
                compras_para_recalcular = [compra]
                self.stdout.write(f"Recalculando compra específica: {compra_id}")
            except Compra.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Compra com ID {compra_id} não encontrada')
                )
                return
        else:
            # Encontrar compras com valor zerado mas que têm itens
            compras_para_recalcular = Compra.objects.filter(
                valor_total_bruto=0
            ).exclude(itens__isnull=True)
            
            self.stdout.write(
                f"Encontradas {compras_para_recalcular.count()} compras com valores zerados mas com itens"
            )

        if not compras_para_recalcular:
            self.stdout.write(self.style.SUCCESS('Nenhuma compra precisa ser recalculada'))
            return

        compras_atualizadas = 0
        valor_total_corrigido = Decimal('0.00')

        for compra in compras_para_recalcular:
            # Primeiro, recalcular valor_total_item de cada item
            itens_atualizados = 0
            for item in compra.itens.all():
                valor_calculado = item.quantidade * item.valor_unitario
                if item.valor_total_item != valor_calculado:
                    if not dry_run:
                        item.valor_total_item = valor_calculado
                        item.save()
                    itens_atualizados += 1
                    self.stdout.write(
                        f"  Item {item.id}: {item.valor_total_item} -> {valor_calculado}"
                    )
            
            # Calcular o novo valor total bruto
            total_calculado = compra.itens.aggregate(
                total=Sum('valor_total_item')
            )['total'] or Decimal('0.00')
            
            if compra.valor_total_bruto != total_calculado:
                self.stdout.write(
                    f"Compra {compra.id}: {compra.valor_total_bruto} -> {total_calculado} "
                    f"({compra.itens.count()} itens, {itens_atualizados} itens atualizados)"
                )
                
                if not dry_run:
                    # Atualizar os valores da compra
                    compra.valor_total_bruto = total_calculado
                    compra.valor_total_liquido = total_calculado - compra.desconto
                    compra.save()
                
                compras_atualizadas += 1
                valor_total_corrigido += total_calculado

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f"DRY RUN: {compras_atualizadas} compras seriam atualizadas "
                    f"com valor total de R$ {valor_total_corrigido:.2f}"
                )
            )
            self.stdout.write(
                self.style.WARNING("Execute sem --dry-run para aplicar as alterações")
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Sucesso! {compras_atualizadas} compras foram recalculadas "
                    f"com valor total corrigido de R$ {valor_total_corrigido:.2f}"
                )
            )