# -*- coding: utf-8 -*-
from django.core.management.base import BaseCommand
from core.models import Compra, ItemCompra, AnexoCompra, ArquivoObra
import os
from django.conf import settings

class Command(BaseCommand):
    help = 'Limpa dados inconsistentes do banco de dados'

    def handle(self, *args, **options):
        self.stdout.write("=== INICIANDO LIMPEZA DE DADOS INCONSISTENTES ===")
        
        # 1. Verificar e remover compras sem itens
        self.cleanup_purchases_without_items()
        
        # 2. Verificar e limpar anexos com arquivos inexistentes
        self.cleanup_missing_files()
        
        self.stdout.write(self.style.SUCCESS("Limpeza concluída com sucesso!"))
    
    def cleanup_purchases_without_items(self):
        self.stdout.write("\n=== VERIFICANDO COMPRAS SEM ITENS ===")
        
        compras_sem_itens = []
        for compra in Compra.objects.all():
            if not ItemCompra.objects.filter(compra=compra).exists():
                compras_sem_itens.append(compra)
        
        self.stdout.write(f"Encontradas {len(compras_sem_itens)} compras sem itens:")
        for compra in compras_sem_itens:
            # Usar campos que existem no modelo Compra
            nota_fiscal = getattr(compra, 'nota_fiscal', 'N/A')
            self.stdout.write(f"  - ID: {compra.id}, Fornecedor: {compra.fornecedor}, Data: {compra.data_compra}, Nota Fiscal: {getattr(compra, 'nota_fiscal', 'N/A')}")
        
        if compras_sem_itens:
            self.stdout.write("\n=== REMOVENDO COMPRAS INVÁLIDAS ===")
            for compra in compras_sem_itens:
                self.stdout.write(f"Removendo compra ID {compra.id} - {compra.fornecedor}")
                compra.delete()
            self.stdout.write(self.style.SUCCESS(f"Removidas {len(compras_sem_itens)} compras inválidas."))
        else:
            self.stdout.write(self.style.SUCCESS("Nenhuma compra inválida encontrada."))
    
    def cleanup_missing_files(self):
        self.stdout.write("\n=== VERIFICANDO ANEXOS COM ARQUIVOS INEXISTENTES ===")
        
        # Verificar AnexoCompra
        anexos_invalidos = []
        for anexo in AnexoCompra.objects.all():
            if anexo.arquivo:
                file_path = os.path.join(settings.MEDIA_ROOT, anexo.arquivo.name)
                if not os.path.exists(file_path):
                    anexos_invalidos.append(anexo)
        
        self.stdout.write(f"Encontrados {len(anexos_invalidos)} anexos de compra com arquivos inexistentes:")
        for anexo in anexos_invalidos:
            self.stdout.write(f"ID: {anexo.id}, Arquivo: {anexo.arquivo.name}, Compra: {anexo.compra.id}")
        
        # Verificar ArquivoObra
        arquivos_obra_invalidos = []
        for arquivo in ArquivoObra.objects.all():
            if arquivo.arquivo:
                file_path = os.path.join(settings.MEDIA_ROOT, arquivo.arquivo.name)
                if not os.path.exists(file_path):
                    arquivos_obra_invalidos.append(arquivo)
        
        self.stdout.write(f"Encontrados {len(arquivos_obra_invalidos)} arquivos de obra com arquivos inexistentes:")
        for arquivo in arquivos_obra_invalidos:
            self.stdout.write(f"ID: {arquivo.id}, Arquivo: {arquivo.arquivo.name}, Obra: {arquivo.obra.id}")
        
        # Remover anexos inválidos
        total_removidos = 0
        if anexos_invalidos:
            self.stdout.write("\n=== REMOVENDO ANEXOS DE COMPRA INVÁLIDOS ===")
            for anexo in anexos_invalidos:
                self.stdout.write(f"Removendo anexo ID {anexo.id} - {anexo.arquivo.name}")
                anexo.delete()
                total_removidos += 1
        
        if arquivos_obra_invalidos:
            self.stdout.write("\n=== REMOVENDO ARQUIVOS DE OBRA INVÁLIDOS ===")
            for arquivo in arquivos_obra_invalidos:
                self.stdout.write(f"Removendo arquivo ID {arquivo.id} - {arquivo.arquivo.name}")
                arquivo.delete()
                total_removidos += 1
        
        if total_removidos > 0:
            self.stdout.write(self.style.SUCCESS(f"Removidos {total_removidos} arquivos inválidos."))
        else:
            self.stdout.write(self.style.SUCCESS("Nenhum arquivo inválido encontrado."))