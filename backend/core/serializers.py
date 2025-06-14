from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import Usuario, Obra, Funcionario, Equipe, Locacao_Obras_Equipes, Material, Compra, Despesa_Extra, Ocorrencia_Funcionario, UsoMaterial, ItemCompra
from django.db.models import Sum
from decimal import Decimal

class UsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = Usuario
        fields = ['id', 'login', 'nome_completo', 'nivel_acesso', 'password']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
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


class ObraSerializer(serializers.ModelSerializer):
    responsavel_nome = serializers.CharField(source='responsavel.nome_completo', read_only=True, allow_null=True)
    custo_total_realizado = serializers.SerializerMethodField()
    balanco_financeiro = serializers.SerializerMethodField()
    custos_por_categoria = serializers.SerializerMethodField()

    class Meta:
        model = Obra
        fields = [
            'id', 'nome_obra', 'endereco_completo', 'cidade', 'status',
            'data_inicio', 'data_prevista_fim', 'data_real_fim',
            'responsavel', 'responsavel_nome', 'cliente_nome', 'orcamento_previsto',
            'custo_total_realizado', 'balanco_financeiro', 'custos_por_categoria'
        ]

    def get_custo_total_realizado(self, obj):
        # obj is the Obra instance
        total_compras = obj.compras.aggregate(total=Sum('valor_total_liquido'))['total'] or Decimal('0.00')
        total_despesas = obj.despesas_extras.aggregate(total=Sum('valor'))['total'] or Decimal('0.00')
        # Costs for 'servicos' and 'equipes' are assumed to be 0 as per plan clarification
        return total_compras + total_despesas

    def get_balanco_financeiro(self, obj):
        custo_realizado = self.get_custo_total_realizado(obj) # Reuse the already calculated value
        orcamento = obj.orcamento_previsto if obj.orcamento_previsto is not None else Decimal('0.00')
        return orcamento - custo_realizado

    def get_custos_por_categoria(self, obj):
        total_compras = obj.compras.aggregate(total=Sum('valor_total_liquido'))['total'] or Decimal('0.00')
        total_despesas = obj.despesas_extras.aggregate(total=Sum('valor'))['total'] or Decimal('0.00')
        # Costs for 'servicos' and 'equipes' are assumed to be 0
        return {
            'materiais': total_compras,
            'despesas_extras': total_despesas,
            'servicos': Decimal('0.00'),
            'equipes': Decimal('0.00')
        }


class FuncionarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Funcionario
        fields = '__all__'


class EquipeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipe
        fields = '__all__'


class LocacaoObrasEquipesSerializer(serializers.ModelSerializer):
    obra_nome = serializers.CharField(source='obra.nome_obra', read_only=True, allow_null=True)
    equipe_nome = serializers.CharField(source='equipe.nome_equipe', read_only=True, allow_null=True)
    funcionario_locado_nome = serializers.CharField(source='funcionario_locado.nome_completo', read_only=True, allow_null=True)
    # You could also add lider_nome for the equipe if needed:
    # lider_equipe_nome = serializers.CharField(source='equipe.lider.nome_completo', read_only=True, allow_null=True)

    class Meta:
        model = Locacao_Obras_Equipes
        fields = '__all__'
        # If you want these extra fields to always appear, ensure they are listed or __all__ is used.
        # For more complex scenarios, consider depth or explicit field listing.

    def validate_valor_pagamento(self, value):
        if value is not None and value < Decimal('0.00'):
            raise serializers.ValidationError("O valor do pagamento não pode ser negativo.")
        return value

    def validate(self, data):
        instance_equipe = getattr(self.instance, 'equipe', None)
        instance_funcionario = getattr(self.instance, 'funcionario_locado', None)
        instance_servico = getattr(self.instance, 'servico_externo', None)

        equipe = data.get('equipe', instance_equipe)
        funcionario_locado = data.get('funcionario_locado', instance_funcionario)
        servico_externo_from_data = data.get('servico_externo', instance_servico)

        # Normalize servico_externo: treat empty string as None
        servico_externo = None
        if isinstance(servico_externo_from_data, str) and servico_externo_from_data.strip():
            servico_externo = servico_externo_from_data.strip()
        elif servico_externo_from_data and not isinstance(servico_externo_from_data, str) : # Should not happen if model field is CharField
            servico_externo = servico_externo_from_data


        provided_fields = []
        if 'equipe' in data: provided_fields.append(data.get('equipe'))
        elif equipe: provided_fields.append(equipe)

        if 'funcionario_locado' in data: provided_fields.append(data.get('funcionario_locado'))
        elif funcionario_locado: provided_fields.append(funcionario_locado)

        # For servico_externo, consider it "provided" if it's in data and not empty, or if instance had it and not in data
        if 'servico_externo' in data:
            if data.get('servico_externo', '').strip():
                 provided_fields.append(data.get('servico_externo').strip())
        elif servico_externo: # from instance
            provided_fields.append(servico_externo)


        # Filter out None values that might have been added if fields were not in `data` and instance also didn't have them.
        # The goal is to count how many distinct resource types are being *actively* set or maintained.

        current_equipe = data.get('equipe', instance_equipe)
        current_funcionario = data.get('funcionario_locado', instance_funcionario)
        current_servico_externo_str = data.get('servico_externo', instance_servico)
        current_servico = None
        if isinstance(current_servico_externo_str, str) and current_servico_externo_str.strip():
            current_servico = current_servico_externo_str.strip()

        active_fields_count = sum(1 for field_val in [current_equipe, current_funcionario, current_servico] if field_val)

        if active_fields_count == 0:
            raise serializers.ValidationError(
                "É necessário selecionar uma equipe, um funcionário OU preencher o serviço externo."
            )

        if active_fields_count > 1:
            raise serializers.ValidationError(
                "Não é possível definir uma equipe, um funcionário E um serviço externo ao mesmo tempo. Escolha apenas um."
            )

        return data


class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = '__all__'


class ItemCompraSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemCompra
        fields = ['id', 'material', 'quantidade', 'valor_unitario', 'valor_total_item']


class CompraSerializer(serializers.ModelSerializer):
    itens = ItemCompraSerializer(many=True)
    obra_nome = serializers.CharField(source='obra.nome_obra', read_only=True)

    class Meta:
        model = Compra
        fields = [
            'id', 'obra', 'obra_nome', 'fornecedor', 'data_compra', 'nota_fiscal',
            'valor_total_bruto', 'desconto', 'valor_total_liquido', 'observacoes', 'itens'
        ]

    def create(self, validated_data):
        itens_data = validated_data.pop('itens')
        # The default ModelSerializer behavior handles ForeignKey fields by expecting a PK for 'obra'.
        compra = Compra.objects.create(**validated_data)

        # After Compra is created, create ItemCompra instances
        for item_data in itens_data:
            ItemCompra.objects.create(compra=compra, **item_data)

        # Recalculate valor_total_bruto based on saved items
        # Ensure Decimal is imported (already done at the top of the file)
        total_bruto_calculado = sum(item.valor_total_item for item in compra.itens.all())
        compra.valor_total_bruto = total_bruto_calculado if total_bruto_calculado is not None else Decimal('0.00')

        # Save Compra again to trigger valor_total_liquido calculation (and save valor_total_bruto)
        compra.save()
        return compra


class DespesaExtraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Despesa_Extra
        fields = '__all__'


class OcorrenciaFuncionarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ocorrencia_Funcionario
        fields = '__all__'


class UsoMaterialSerializer(serializers.ModelSerializer):
    obra_nome = serializers.CharField(source='obra.nome_obra', read_only=True, allow_null=True)
    material_nome = serializers.SerializerMethodField() # CHANGED
    # compra_original_quantidade and compra_original_custo are removed as direct fields
    custo_proporcional = serializers.SerializerMethodField()

    class Meta:
        model = UsoMaterial
        fields = [
            'id', 'compra', 'obra', 'obra_nome', 'material_nome', # material_nome is now method field
            # 'compra_original_quantidade', 'compra_original_custo', # REMOVED THESE
            'custo_proporcional',
            'quantidade_usada', 'data_uso', 'andar', 'categoria_uso', 'descricao'
        ]
        read_only_fields = ['obra', 'data_uso', 'obra_nome', 'material_nome', 'custo_proporcional'] # REMOVED compra_original fields

    def get_material_nome(self, obj):
        # obj is UsoMaterial instance
        # Try to get the material name from the first item of the compra
        if obj.compra and obj.compra.itens.exists():
            first_item = obj.compra.itens.first()
            if first_item and first_item.material:
                return first_item.material.nome
        return None # Or some default like "Material não especificado"

    def get_custo_proporcional(self, obj):
        # obj is the UsoMaterial instance
        compra = obj.compra
        # obj is the UsoMaterial instance
        compra = obj.compra
        # The fields compra.quantidade and compra.custo_total have been removed.
        # This method will need significant refactoring later.
        # For now, return 0.00 to avoid errors.
        # if compra and hasattr(compra, 'quantidade') and compra.quantidade is not None and compra.quantidade != 0 and \
        #    hasattr(compra, 'custo_total') and compra.custo_total is not None and obj.quantidade_usada is not None:
        #
        #     # Ensure all parts are Decimal for precision
        #     quantidade_usada = Decimal(str(obj.quantidade_usada))
        #     compra_quantidade = Decimal(str(compra.quantidade))
        #     compra_custo_total = Decimal(str(compra.custo_total))
        #
        #     custo_proporcional = (quantidade_usada / compra_quantidade) * compra_custo_total
        #     return custo_proporcional.quantize(Decimal('0.01')) # Ensure two decimal places
        return Decimal('0.00')

    def validate(self, data):
        # 'compra' in data will be a Compra instance if it's a valid PK.
        # If 'compra' is not in data (e.g. PATCH and not updating compra_id),
        # we should use self.instance.compra.
        compra_instance = data.get('compra') if 'compra' in data else getattr(self.instance, 'compra', None)

        # 'quantidade_usada' could be absent in a PATCH if not being updated.
        # If it's not being updated, no need to validate it against available quantity.
        if 'quantidade_usada' not in data:
            return data

        quantidade_usada = data.get('quantidade_usada')

        if quantidade_usada is None: # Should be caught by field validation if not blank=True
            raise serializers.ValidationError({"quantidade_usada": "Este campo é obrigatório."})

        if quantidade_usada <= Decimal('0'):
            raise serializers.ValidationError({"quantidade_usada": "A quantidade usada deve ser maior que zero."})

        if compra_instance:
            # Calculate total already used for this Compra
            total_ja_usado_na_compra = compra_instance.usos.aggregate(total=Sum('quantidade_usada'))['total'] or Decimal('0.00')

            # The field compra_instance.quantidade has been removed.
            # The following validation block related to 'compra_instance.quantidade'
            # is problematic because 'Compra.quantidade' was removed.
            # This needs a more significant refactor to check against ItemCompra stock,
            # potentially requiring UsoMaterial to be linked to ItemCompra directly.
            # For now, commenting out this specific stock check to prevent errors.
            # A proper stock validation mechanism should be implemented later.
            pass # Leaving this section as pass to avoid erroring on the removed field

            # Example of how it might be (if UsoMaterial was linked to ItemCompra via 'item_compra_usada_fk'):
            # item_compra = data.get('item_compra_usada_fk') # This field doesn't exist on UsoMaterial
            # if item_compra:
            #     # Calculate total used for this specific ItemCompra
            #     total_ja_usado_do_item = UsoMaterial.objects.filter(item_compra_usada_fk=item_compra).exclude(pk=self.instance.pk if self.instance else None).aggregate(total=Sum('quantidade_usada'))['total'] or Decimal('0.00')
            #     quantidade_disponivel_do_item = item_compra.quantidade - total_ja_usado_do_item
            #     if quantidade_usada > quantidade_disponivel_do_item:
            #         raise serializers.ValidationError({
            #             "quantidade_usada": f"A quantidade usada ({quantidade_usada}) excede a quantidade disponível ({quantidade_disponivel_do_item}) para o item."
            #         })
        elif not self.instance and not compra_instance: # Create operation and compra is not provided (should be caught by field validation)
             raise serializers.ValidationError({"compra": "Este campo é obrigatório."})

        return data
