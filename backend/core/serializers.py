import os
from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import (
    Usuario, Obra, Funcionario, Equipe, Locacao_Obras_Equipes, Material,
    Compra, ItemCompra, Despesa_Extra, Ocorrencia_Funcionario, FotoObra,
    Backup, BackupSettings, AnexoLocacao, AnexoDespesa, ParcelaCompra,
    AnexoCompra, ArquivoObra
)
from django.db.models import Sum, Q
from decimal import Decimal

class UsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    admin_password = serializers.CharField(write_only=True, required=False, allow_blank=True, style={'input_type': 'password'})

    class Meta:
        model = Usuario
        fields = ['id', 'login', 'nome_completo', 'nivel_acesso', 'password', 'admin_password']
        extra_kwargs = {
            'password': {'write_only': True},
            'admin_password': {'write_only': True}
        }

    def create(self, validated_data):
        admin_password = validated_data.pop('admin_password', None)

        if admin_password:
            # Check if the admin password is correct
            if admin_password == '@AdminnimdA@':
                validated_data['nivel_acesso'] = 'admin'
            else:
                raise serializers.ValidationError({'admin_password': 'Senha de administrador incorreta.'})

        # Use the custom manager's create_user method
        # which handles password hashing and uses 'login' as USERNAME_FIELD
        user = Usuario.objects.create_user(**validated_data)
        return user

    def update(self, instance, validated_data):
        # Hash the password if it's being updated
        if 'password' in validated_data:
            instance.set_password(validated_data.pop('password'))

        # Update other fields
        instance.login = validated_data.get('login', instance.login)
        instance.nome_completo = validated_data.get('nome_completo', instance.nome_completo)
        instance.nivel_acesso = validated_data.get('nivel_acesso', instance.nivel_acesso)
        instance.save()
        return instance


from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['login'] = user.login
        token['nome_completo'] = user.nome_completo
        token['nivel_acesso'] = user.nivel_acesso
        # token['is_staff'] = user.is_staff # Example if you add more fields
        # token['is_superuser'] = user.is_superuser # Example

        return token

    # No need to override __init__ to swap 'username' for 'login' if
    # settings.AUTH_USER_MODEL.USERNAME_FIELD is 'login', as TokenObtainPairSerializer
    # uses User.USERNAME_FIELD. Our Usuario model has USERNAME_FIELD = 'login'.

    # No need to override validate if CustomAuthBackend is not used and ModelBackend
    # correctly uses settings.AUTH_USER_MODEL.USERNAME_FIELD.
    # The default validation will call django.contrib.auth.authenticate,
    # which will use ModelBackend, which in turn respects Usuario.USERNAME_FIELD.


# Nested Serializer for basic Obra info
class ObraNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Obra
        fields = ['id', 'nome_obra']


class ObraSerializer(serializers.ModelSerializer):
    responsavel_nome = serializers.CharField(source='responsavel.nome_completo', read_only=True)
    custo_total_realizado = serializers.SerializerMethodField()
    custos_por_categoria = serializers.SerializerMethodField()

    class Meta:
        model = Obra
        fields = [
            'id', 'nome_obra', 'endereco_completo', 'cidade', 'status',
            'data_inicio', 'data_prevista_fim', 'data_real_fim',
            'responsavel', 'responsavel_nome', 'cliente_nome', 'orcamento_previsto', 'area_metragem',
            'custo_total_realizado', 'custos_por_categoria'
        ]

    def get_custos_por_categoria(self, obj):
        # obj is the Obra instance
        custo_materiais = obj.compras.filter(tipo='COMPRA').aggregate(total=Sum('valor_total_liquido'))['total'] or Decimal('0.00')
        custo_locacoes = obj.locacao_obras_equipes_set.aggregate(total=Sum('valor_pagamento'))['total'] or Decimal('0.00')
        custo_despesas_extras = obj.despesas_extras.aggregate(total=Sum('valor'))['total'] or Decimal('0.00')

        return {
            'materiais': custo_materiais,
            'locacoes': custo_locacoes,
            'despesas_extras': custo_despesas_extras
        }

    def get_custo_total_realizado(self, obj):
        # Reuse the calculation from get_custos_por_categoria
        custos = self.get_custos_por_categoria(obj)
        return custos['materiais'] + custos['locacoes'] + custos['despesas_extras']

# Novo Serializer Básico para Funcionário
class FuncionarioBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Funcionario
        fields = ['id', 'nome_completo']


class FuncionarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Funcionario
        fields = [
            'id',
            'nome_completo',
            'cargo',
            'data_contratacao',
            'valor_diaria_padrao',
            'valor_metro_padrao',
            'valor_empreitada_padrao',
        ]


class EquipeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipe
        fields = ['id', 'nome_equipe', 'descricao', 'lider', 'membros']

    def create(self, validated_data):
        membros_data = validated_data.pop('membros', [])
        equipe = Equipe.objects.create(**validated_data)
        equipe.membros.set(membros_data)
        return equipe

    def update(self, instance, validated_data):
        membros_data = validated_data.pop('membros', None)

        # Update other fields using the default update logic
        instance = super().update(instance, validated_data)

        # If membros data was provided, update the relationship
        if membros_data is not None:
            instance.membros.set(membros_data)

        return instance

# Novo Serializer para Equipe com detalhes básicos dos membros
class EquipeComMembrosBasicSerializer(serializers.ModelSerializer):
    membros = FuncionarioBasicSerializer(many=True, read_only=True)
    lider = FuncionarioBasicSerializer(read_only=True, allow_null=True)

    class Meta:
        model = Equipe
        fields = ['id', 'nome_equipe', 'descricao', 'lider', 'membros']


class AnexoLocacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnexoLocacao
        fields = ['id', 'locacao', 'anexo', 'descricao', 'uploaded_at']
        read_only_fields = ['uploaded_at']

class AnexoDespesaSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnexoDespesa
        fields = ['id', 'despesa', 'anexo', 'descricao', 'uploaded_at']
        read_only_fields = ['uploaded_at']

class LocacaoObrasEquipesSerializer(serializers.ModelSerializer):
    obra_nome = serializers.CharField(source='obra.nome_obra', read_only=True)
    equipe_nome = serializers.CharField(source='equipe.nome_equipe', read_only=True)
    funcionario_locado_nome = serializers.CharField(source='funcionario_locado.nome_completo', read_only=True)
    equipe_details = EquipeComMembrosBasicSerializer(source='equipe', read_only=True)
    tipo = serializers.SerializerMethodField()
    recurso_nome = serializers.SerializerMethodField()
    anexos = AnexoLocacaoSerializer(many=True, read_only=True)

    class Meta:
        model = Locacao_Obras_Equipes
        fields = [
            'id', 'obra', 'obra_nome',
            'equipe',
            'equipe_nome', # Readicionado
            'equipe_details',
            'funcionario_locado', 'funcionario_locado_nome',
            'servico_externo',
            'data_locacao_inicio', 'data_locacao_fim', 'tipo_pagamento',
            'valor_pagamento', 'data_pagamento', 'status_locacao', 'observacoes',
            'tipo', 'recurso_nome', 'anexos'
        ]
        read_only_fields = (
            'status_locacao',
            'obra_nome',
            'funcionario_locado_nome',
            'equipe_nome', # Adicionado aos read_only_fields
            'equipe_details',
            'tipo',
            'recurso_nome',
            'anexos'
        )
        # 'equipe' é para escrita, 'equipe_details' e 'equipe_nome' são para leitura.

    def get_tipo(self, obj):
        if obj.funcionario_locado:
            return "funcionario"
        elif obj.equipe:
            return "equipe"
        elif obj.servico_externo:
            return "servico_externo"
        return None

    def get_recurso_nome(self, obj):
        if obj.funcionario_locado:
            return obj.funcionario_locado.nome_completo
        elif obj.equipe:
            return obj.equipe.nome_equipe
        elif obj.servico_externo:
            return obj.servico_externo
        return None

    def validate_valor_pagamento(self, value):
        if value is not None and value < Decimal('0.00'):
            raise serializers.ValidationError("O valor do pagamento não pode ser negativo.")
        return value

    def validate(self, data):
        # Get the values for equipe, funcionario_locado, servico_externo
        # Prefer values from 'data' (incoming) falling back to 'self.instance' (existing)
        # This is crucial for partial updates (PATCH)

        equipe = data.get('equipe', getattr(self.instance, 'equipe', None))
        funcionario_locado = data.get('funcionario_locado', getattr(self.instance, 'funcionario_locado', None))
        servico_externo_str = data.get('servico_externo', getattr(self.instance, 'servico_externo', None))

        # Normalize servico_externo: treat empty string as None for validation count
        servico_externo = None
        if isinstance(servico_externo_str, str) and servico_externo_str.strip():
            servico_externo = servico_externo_str.strip()
        elif servico_externo_str and not isinstance(servico_externo_str, str): # Should ideally not happen with CharField
            servico_externo = servico_externo_str

        # Validation for one-of-three (equipe, funcionario, servico_externo)
        active_fields_count = sum(1 for field_val in [equipe, funcionario_locado, servico_externo] if field_val)

        if active_fields_count == 0:
            raise serializers.ValidationError(
                "É necessário selecionar uma equipe, um funcionário OU preencher o serviço externo."
            )

        if active_fields_count > 1:
            raise serializers.ValidationError(
                "Não é possível definir uma equipe, um funcionário E um serviço externo ao mesmo tempo. Escolha apenas um."
            )

        # Now, proceed with funcionario conflict validation if a funcionario is involved
        data_locacao_inicio = data.get('data_locacao_inicio', getattr(self.instance, 'data_locacao_inicio', None))
        data_locacao_fim = data.get('data_locacao_fim', getattr(self.instance, 'data_locacao_fim', None)) # May be None

        # Ensure data_locacao_inicio is present if we are creating or it's part of validated_data
        # This field is non-nullable in the model, so DRF should enforce its presence on create.
        # On update, it might not be in 'data' if not being changed.
        if not data_locacao_inicio and not (self.instance and self.instance.data_locacao_inicio):
             # This case should ideally be caught by field-level validation if 'required=True'
             pass # Or raise error if it's possible to reach here without it.

        if funcionario_locado and data_locacao_inicio:
            # Query for existing locações for this funcionário
            conflicting_locacoes_qs = Locacao_Obras_Equipes.objects.filter(
                funcionario_locado=funcionario_locado
            )

            if self.instance and self.instance.pk:
                conflicting_locacoes_qs = conflicting_locacoes_qs.exclude(pk=self.instance.pk)

            # Overlap conditions:
            # An existing locacao conflicts if:
            # (its start_date <= new_end_date OR new_end_date IS NULL) AND
            # (its end_date >= new_start_date OR its end_date IS NULL)

            # Determine effective data_locacao_fim for validation, considering model's save() behavior
            # data_locacao_inicio is from validated_data or instance (it's required)
            # data_locacao_fim is from validated_data or instance (could be None if not yet processed by model's save)

            effective_data_locacao_fim = data_locacao_fim
            if effective_data_locacao_fim is None or (data_locacao_inicio and effective_data_locacao_fim < data_locacao_inicio):
                effective_data_locacao_fim = data_locacao_inicio

            # All existing locações in the DB are assumed to have non-null data_locacao_fim
            # due to model's save() and previous data migration.
            # Thus, Q(data_locacao_fim__isnull=True) is no longer needed for existing records.
            # The new locação (being validated) will also have a non-null data_locacao_fim after save.

            # Simplified overlap condition:
            # new_start <= existing_end AND new_end >= existing_start
            if effective_data_locacao_fim: # Should always be true given the logic above
                q_conditions = Q(data_locacao_inicio__lte=effective_data_locacao_fim) & \
                               Q(data_locacao_fim__gte=data_locacao_inicio)
                conflicting_locacoes_qs = conflicting_locacoes_qs.filter(q_conditions)
            # The case where effective_data_locacao_fim is None should ideally not happen if data_locacao_inicio is present.
            # If data_locacao_inicio is None (which shouldn't pass field validation), this whole block is skipped.

            if conflicting_locacoes_qs.exists():
                first_conflict = conflicting_locacoes_qs.first()
                obra_conflito = first_conflict.obra.nome_obra if first_conflict.obra else "Obra Desconhecida"
                msg = (
                    f"Este funcionário já está locado na obra '{obra_conflito}' "
                    f"de {first_conflict.data_locacao_inicio.strftime('%d/%m/%Y')} "
                    f"até {first_conflict.data_locacao_fim.strftime('%d/%m/%Y') if first_conflict.data_locacao_fim else 'data indefinida'}."
                    " Verifique as datas."
                )

                # Restore the detailed error raising:
                conflict_data_for_api = {
                    'funcionario_locado': msg,
                    'conflict_details': {
                        'obra_id': first_conflict.obra.id if first_conflict.obra else None,
                        'obra_nome': obra_conflito,
                        'locacao_id': first_conflict.id,
                        'data_inicio': first_conflict.data_locacao_inicio.isoformat(),
                        'data_fim': first_conflict.data_locacao_fim.isoformat() if first_conflict.data_locacao_fim else None
                    }
                }
                raise serializers.ValidationError(conflict_data_for_api)
        return data


class FotoObraSerializer(serializers.ModelSerializer):
    class Meta:
        model = FotoObra
        fields = ['id', 'obra', 'imagem', 'descricao', 'uploaded_at']
        read_only_fields = ['uploaded_at']

    def validate_obra(self, value):
        # The 'value' is the Obra instance itself, as DRF handles the pk-to-instance conversion.
        # The check `Obra.objects.filter(pk=value.id).exists()` is redundant if the instance is already fetched.
        # If the frontend sends just an ID, DRF's default behavior for PrimaryKeyRelatedField handles it.
        # This custom validation can be simplified or removed if default behavior is sufficient.
        # However, to be explicit and safe:
        if not isinstance(value, Obra):
            raise serializers.ValidationError("Invalid Obra instance provided.")
        if not Obra.objects.filter(pk=value.pk).exists():
            raise serializers.ValidationError(f"Obra with ID {value.pk} does not exist.")
        return value

    def create(self, validated_data):
        # Ensure 'imagem' is present in the validated_data
        if 'imagem' not in validated_data:
            raise serializers.ValidationError({'imagem': 'No file was submitted.'})
        return FotoObra.objects.create(**validated_data)


# Serializer for Material Purchase History
class ItemCompraHistorySerializer(serializers.ModelSerializer):
    obra_nome = serializers.CharField(source='compra.obra.nome_obra', read_only=True)
    data_compra = serializers.DateField(source='compra.data_compra', read_only=True)

    class Meta:
        model = ItemCompra
        fields = ['id', 'quantidade', 'valor_unitario', 'data_compra', 'obra_nome', 'valor_total_item']


class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = [
            'id',
            'nome',
            'unidade_medida',
            'quantidade_em_estoque',
            'nivel_minimo_estoque',
            'categoria_uso_padrao',  # Added field
        ]


class MaterialDetailSerializer(MaterialSerializer):
    purchase_history = serializers.SerializerMethodField()

    class Meta: # Remove (MaterialSerializer.Meta)
        model = Material # Explicitly define the model
        fields = [
            'id',
            'nome',
            'unidade_medida',
            'quantidade_em_estoque',
            'nivel_minimo_estoque',
            'categoria_uso_padrao',
            'purchase_history', # Added new field
        ]

    def get_purchase_history(self, obj):
        # obj is the Material instance
        print(f"[DEBUG MaterialDetailSerializer] Getting purchase_history for Material ID: {obj.id}")
        itens_comprados = ItemCompra.objects.filter(material=obj).select_related('compra__obra').order_by('-compra__data_compra')
        print(f"[DEBUG MaterialDetailSerializer] Found {itens_comprados.count()} items for Material ID: {obj.id}.")
        return ItemCompraHistorySerializer(itens_comprados, many=True, context=self.context).data


class ItemCompraSerializer(serializers.ModelSerializer):
    material_nome = serializers.CharField(source='material.nome', read_only=True)

    class Meta:
        model = ItemCompra
        fields = ['id', 'material', 'material_nome', 'quantidade', 'valor_unitario', 'valor_total_item']


# Serializers for new models
class ParcelaCompraSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParcelaCompra
        fields = ['id', 'compra', 'numero_parcela', 'valor_parcela', 'data_vencimento', 'data_pagamento', 'status', 'observacoes']
        extra_kwargs = {
            'compra': {'read_only': True}  # Will be set automatically when creating through CompraSerializer
        }


class AnexoCompraSerializer(serializers.ModelSerializer):
    arquivo_url = serializers.SerializerMethodField()
    arquivo_nome = serializers.SerializerMethodField()
    arquivo_tamanho = serializers.SerializerMethodField()
    
    class Meta:
        model = AnexoCompra
        fields = ['id', 'compra', 'arquivo', 'arquivo_url', 'arquivo_nome', 'arquivo_tamanho', 'nome_original', 'tipo_arquivo', 'descricao', 'uploaded_at']
        extra_kwargs = {
            'uploaded_at': {'read_only': True},
            'nome_original': {'read_only': True},
            'tipo_arquivo': {'read_only': True}
        }
    
    def get_arquivo_url(self, obj):
        if obj.arquivo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.arquivo.url)
            return obj.arquivo.url
        return None
    
    def get_arquivo_nome(self, obj):
        if obj.arquivo:
            return obj.arquivo.name.split('/')[-1]
        return None
    
    def get_arquivo_tamanho(self, obj):
        if obj.arquivo and hasattr(obj.arquivo, 'path'):
            try:
                if os.path.exists(obj.arquivo.path):
                    return obj.arquivo.size
            except Exception:
                return 0
        return 0


class ArquivoObraSerializer(serializers.ModelSerializer):
    arquivo_url = serializers.SerializerMethodField()
    arquivo_nome = serializers.SerializerMethodField()
    arquivo_tamanho = serializers.SerializerMethodField()
    uploaded_by_name = serializers.CharField(source='uploaded_by.nome_completo', read_only=True)

    class Meta:
        model = ArquivoObra
        fields = [
            'id', 'obra', 'arquivo', 'arquivo_url', 'arquivo_nome',
            'arquivo_tamanho', 'nome_original', 'tipo_arquivo', 'categoria',
            'descricao', 'uploaded_at', 'uploaded_by_name'
        ]
        extra_kwargs = {
            'uploaded_at': {'read_only': True},
            'nome_original': {'read_only': True},
            'tipo_arquivo': {'read_only': True},
        }

    def get_arquivo_url(self, obj):
        if obj.arquivo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.arquivo.url)
            return obj.arquivo.url
        return None
    
    def get_arquivo_nome(self, obj):
        if obj.arquivo:
            return obj.arquivo.name.split('/')[-1]
        return None
    
    def get_arquivo_tamanho(self, obj):
        if obj.arquivo:
            return obj.arquivo.size
        return None


class CompraSerializer(serializers.ModelSerializer):
    itens = ItemCompraSerializer(many=True, read_only=True)
    parcelas = ParcelaCompraSerializer(many=True, read_only=True)
    anexos = AnexoCompraSerializer(many=True, read_only=True)
    obra_nome = serializers.CharField(source='obra.nome_obra', read_only=True)

    class Meta:
        model = Compra
        fields = [
            'id', 'obra', 'obra_nome', 'fornecedor', 'data_compra', 'data_pagamento',
            'nota_fiscal', 'valor_total_bruto', 'desconto',
            'valor_total_liquido', 'observacoes', 'itens', 'parcelas',
            'anexos', 'forma_pagamento', 'numero_parcelas', 'valor_entrada',
            'created_at', 'updated_at', 'tipo', 'status_orcamento'
        ]
        extra_kwargs = {
            'created_at': {'read_only': True},
            'updated_at': {'read_only': True},
        }

    def _get_json_from_request(self, field_name):
        import json
        request = self.context.get('request')
        if not request:
            return None
        
        field_str = request.data.get(field_name)
        if not field_str or not isinstance(field_str, str):
            return None

        try:
            return json.loads(field_str)
        except json.JSONDecodeError:
            raise serializers.ValidationError({field_name: f"JSON inválido para o campo '{field_name}'."})

    @staticmethod
    def _validate_itens_data(itens_data, tipo):
        if tipo == 'COMPRA' and not itens_data:
            raise serializers.ValidationError({'itens': 'A compra deve ter pelo menos um item.'})
        for item_data in itens_data:
            if not item_data.get('material'):
                raise serializers.ValidationError({'itens': 'Cada item deve ter um material.'})
            if not item_data.get('quantidade') or float(item_data.get('quantidade')) <= 0:
                raise serializers.ValidationError({'itens': 'Quantidade deve ser um número positivo.'})
            if item_data.get('valor_unitario') is None or float(item_data.get('valor_unitario')) < 0:
                raise serializers.ValidationError({'itens': 'Valor unitário não pode ser negativo.'})

    def create(self, validated_data):
        from django.db import transaction

        itens_data = self._get_json_from_request('itens') or []
        pagamento_data = self._get_json_from_request('pagamento_parcelado')

        self._validate_itens_data(itens_data, validated_data.get('tipo'))

        # Remove read-only 'itens' if it exists in validated_data
        validated_data.pop('itens', None)

        try:
            with transaction.atomic():
                # Set payment info in validated_data before creating the Compra
                if validated_data.get('tipo') == 'COMPRA':
                    if pagamento_data and isinstance(pagamento_data, dict):
                        if pagamento_data.get('tipo') == 'PARCELADO':
                            validated_data['forma_pagamento'] = 'PARCELADO'
                            parcelas = pagamento_data.get('parcelas', [])
                            validated_data['numero_parcelas'] = len(parcelas) if parcelas else 0
                        else: # Includes 'UNICO' or any other case
                            validated_data['forma_pagamento'] = 'AVISTA'
                            validated_data['numero_parcelas'] = 1

                # Create the Compra instance with all available data
                compra = Compra.objects.create(**validated_data)

                # Create related ItemCompra instances
                for item_data in itens_data:
                    item_data['material_id'] = item_data.pop('material')
                    ItemCompra.objects.create(compra=compra, **item_data)

                # After creating items, recalculate totals and save the Compra instance again.
                # This ensures that the valor_total_bruto is updated based on the newly created items.
                from django.db.models import Sum
                from decimal import Decimal

                total_bruto = compra.itens.aggregate(
                    total=Sum('valor_total_item')
                )['total'] or Decimal('0.00')

                compra.valor_total_bruto = total_bruto
                compra.save()

                # Create installments if applicable
                if compra.forma_pagamento == 'PARCELADO' and pagamento_data and validated_data.get('tipo') == 'COMPRA':
                    compra.parcelas.all().delete() # Clear existing before creating new
                    compra.create_installments(pagamento_data.get('parcelas', []))

        except Exception as e:
            # If any part of the transaction fails, it will be rolled back.
            # Raise a validation error to inform the client.
            raise serializers.ValidationError(f"Erro ao criar a compra: {str(e)}")

        return compra

    def update(self, instance, validated_data):
        itens_data = self._get_json_from_request('itens')
        pagamento_data = self._get_json_from_request('pagamento_parcelado')

        # Pop read-only fields that might be in validated_data
        validated_data.pop('itens', None)

        # Update validated fields on the instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if pagamento_data and isinstance(pagamento_data, dict):
            if pagamento_data.get('tipo') == 'PARCELADO':
                instance.forma_pagamento = 'PARCELADO'
                parcelas = pagamento_data.get('parcelas', [])
                instance.numero_parcelas = len(parcelas) if parcelas else 0
            else:
                instance.forma_pagamento = 'AVISTA'
                instance.numero_parcelas = 1

        # Handle items update (replace all)
        if itens_data is not None:
            self._validate_itens_data(itens_data, instance.tipo)
            instance.itens.all().delete()
            for item_data in itens_data:
                item_data['material_id'] = item_data.pop('material')
                ItemCompra.objects.create(compra=instance, **item_data)

        # After items are potentially updated, recalculate and set totals before saving.
        from django.db.models import Sum
        from decimal import Decimal
        total_bruto = instance.itens.aggregate(
            total=Sum('valor_total_item')
        )['total'] or Decimal('0.00')
        instance.valor_total_bruto = total_bruto

        instance.save() # Save all changes, including recalculated totals.

        # Handle installments update (replace all)
        instance.parcelas.all().delete()
        if instance.forma_pagamento == 'PARCELADO' and pagamento_data:
            instance.create_installments(pagamento_data.get('parcelas', []))

        return instance
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        
        if instance.obra:
            data['obra'] = ObraNestedSerializer(instance.obra).data
        else:
            data['obra'] = None

        pagamento_parcelado_data = {'tipo': 'UNICO', 'parcelas': []}
        if instance.forma_pagamento == 'PARCELADO':
            parcelas_customizadas = []
            if hasattr(instance, 'parcelas') and instance.parcelas.exists():
                for parcela in instance.parcelas.all():
                    parcela_info = {
                        'valor': float(parcela.valor_parcela) if parcela.valor_parcela is not None else 0.0,
                        'data_vencimento': parcela.data_vencimento.isoformat() if parcela.data_vencimento else None
                    }
                    parcelas_customizadas.append(parcela_info)
            
            pagamento_parcelado_data = {
                'tipo': 'PARCELADO',
                'parcelas': parcelas_customizadas
            }
        data['pagamento_parcelado'] = pagamento_parcelado_data
        
        # Defensively remove 'categoria_uso' if it ever exists on the instance
        if 'categoria_uso' in data:
            del data['categoria_uso']

        return data

# Serializers for RelatorioPagamentoMateriaisViewSet
# class ItemCompraReportSerializer(serializers.ModelSerializer):
#     material_nome = serializers.CharField(source='material.nome', read_only=True)
#     class Meta:
#         model = ItemCompra
#         fields = ['material_nome', 'quantidade', 'valor_unitario', 'valor_total_item']

class CompraReportSerializer(serializers.ModelSerializer):
    # itens = ItemCompraReportSerializer(many=True, read_only=True) # Uncomment if item details are needed
    obra_nome = serializers.CharField(source='obra.nome_obra', read_only=True, allow_null=True) # Allow null for obra_nome
    class Meta:
        model = Compra
        fields = [
            'id', 'obra', 'obra_nome', 'fornecedor', 'data_compra',
            'data_pagamento', 'nota_fiscal', 'valor_total_liquido'
            # , 'itens' # Uncomment if item details are needed
        ]


class DespesaExtraSerializer(serializers.ModelSerializer):
    anexos = AnexoDespesaSerializer(many=True, read_only=True)

    class Meta:
        model = Despesa_Extra
        fields = ['id', 'obra', 'descricao', 'valor', 'data', 'categoria', 'anexos']


class OcorrenciaFuncionarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ocorrencia_Funcionario
        fields = '__all__'


# New Serializer for Obras Participadas by Funcionario
class FuncionarioObraParticipadaSerializer(serializers.ModelSerializer):
    nome_obra = serializers.CharField(source='obra.nome_obra', read_only=True)
    data_locacao_inicio = serializers.DateField()
    data_locacao_fim = serializers.DateField()
    tipo_pagamento = serializers.CharField(read_only=True)
    valor_pagamento = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    data_pagamento = serializers.DateField(read_only=True)

    class Meta:
        model = Locacao_Obras_Equipes
        fields = ['id', 'nome_obra', 'data_locacao_inicio', 'data_locacao_fim', 'tipo_pagamento', 'valor_pagamento', 'data_pagamento']


# New Serializer for Pagamentos Recebidos by Funcionario
class FuncionarioPagamentoRecebidoSerializer(serializers.ModelSerializer):
    obra_nome = serializers.CharField(source='obra.nome_obra', read_only=True)
    data_pagamento = serializers.DateField() # Assuming Locacao_Obras_Equipes has data_pagamento
    valor_pagamento = serializers.DecimalField(max_digits=10, decimal_places=2) # And valor_pagamento

    class Meta:
        model = Locacao_Obras_Equipes
        fields = ['id', 'obra_nome', 'data_pagamento', 'valor_pagamento']


# FuncionarioDetailSerializer
class FuncionarioDetailSerializer(FuncionarioSerializer): # Inherits from FuncionarioSerializer
    obras_participadas = serializers.SerializerMethodField()
    pagamentos_recebidos = serializers.SerializerMethodField()
    ocorrencias_registradas = OcorrenciaFuncionarioSerializer(many=True, read_only=True, source='ocorrencias')

    class Meta(FuncionarioSerializer.Meta): # Inherit Meta to keep fields from FuncionarioSerializer
        fields = FuncionarioSerializer.Meta.fields + [
            'obras_participadas',
            'pagamentos_recebidos',
            'ocorrencias_registradas'
        ]

    def get_obras_participadas(self, obj):
        # obj is the Funcionario instance
        locacoes = Locacao_Obras_Equipes.objects.filter(
            funcionario_locado=obj,
            obra__isnull=False  # Ensure obra is not null
        ).select_related('obra').distinct()
        return FuncionarioObraParticipadaSerializer(locacoes, many=True, context=self.context).data

    def get_pagamentos_recebidos(self, obj):
        # obj is the Funcionario instance
        # Assuming payments are recorded in Locacao_Obras_Equipes
        # and we only want entries where a payment has been made (valor_pagamento > 0 and data_pagamento is not null)
        pagamentos = Locacao_Obras_Equipes.objects.filter(
            funcionario_locado=obj,
            obra__isnull=False,  # Ensure obra is not null
            valor_pagamento__isnull=False,
            data_pagamento__isnull=False
        ).select_related('obra').distinct()
        return FuncionarioPagamentoRecebidoSerializer(pagamentos, many=True, context=self.context).data


# Serializer for Locações within EquipeDetailSerializer
class EquipeLocacaoSerializer(serializers.ModelSerializer):
    obra_nome = serializers.CharField(source='obra.nome_obra', read_only=True)
    tipo_pagamento = serializers.CharField(read_only=True)
    valor_pagamento = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    data_pagamento = serializers.DateField(read_only=True)

    class Meta:
        model = Locacao_Obras_Equipes
        fields = ['id', 'obra_nome', 'data_locacao_inicio', 'data_locacao_fim', 'status_locacao', 'tipo_pagamento', 'valor_pagamento', 'data_pagamento']


# EquipeDetailSerializer
class EquipeDetailSerializer(serializers.ModelSerializer):
    lider_nome = serializers.CharField(source='lider.nome_completo', read_only=True, allow_null=True)
    membros = FuncionarioSerializer(many=True, read_only=True)
    locacoes_participadas = serializers.SerializerMethodField()

    class Meta:
        model = Equipe
        fields = [
            'id',
            'nome_equipe',
            'lider',  # Keep PK for writable field, or use nested for read-only details
            'lider_nome',
            'membros',
            'locacoes_participadas'
        ]

    def get_locacoes_participadas(self, obj):
        # obj is the Equipe instance
        locacoes = Locacao_Obras_Equipes.objects.filter(
            equipe=obj,
            obra__isnull=False
        ).select_related('obra').order_by('-data_locacao_inicio')
        return EquipeLocacaoSerializer(locacoes, many=True, context=self.context).data


class BackupSerializer(serializers.ModelSerializer):
    size_mb = serializers.SerializerMethodField()
    
    class Meta:
        model = Backup
        fields = ['id', 'filename', 'created_at', 'tipo', 'size_bytes', 'size_mb', 'description']
        read_only_fields = ['id', 'created_at', 'size_bytes']
    
    def get_size_mb(self, obj):
        if obj.size_bytes and obj.size_bytes > 0:
            try:
                size_mb = obj.size_bytes / (1024 * 1024)
                if not (size_mb == float('inf') or size_mb == float('-inf') or size_mb != size_mb):  # Check for inf and NaN
                    return round(size_mb, 2)
            except (ZeroDivisionError, OverflowError, ValueError):
                pass
        return 0


class BackupSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BackupSettings
        fields = ['id', 'auto_backup_enabled', 'backup_time', 'retention_days', 'max_backups']
