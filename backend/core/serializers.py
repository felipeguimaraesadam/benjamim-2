from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import Usuario, Obra, Funcionario, Equipe, Alocacao_Obras_Equipes, Material, Compra, Despesa_Extra, Ocorrencia_Funcionario, UsoMaterial
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
        total_compras = obj.compras.aggregate(total=Sum('custo_total'))['total'] or Decimal('0.00')
        total_despesas = obj.despesas_extras.aggregate(total=Sum('valor'))['total'] or Decimal('0.00')
        # Costs for 'servicos' and 'equipes' are assumed to be 0 as per plan clarification
        return total_compras + total_despesas

    def get_balanco_financeiro(self, obj):
        custo_realizado = self.get_custo_total_realizado(obj) # Reuse the already calculated value
        orcamento = obj.orcamento_previsto if obj.orcamento_previsto is not None else Decimal('0.00')
        return orcamento - custo_realizado

    def get_custos_por_categoria(self, obj):
        total_compras = obj.compras.aggregate(total=Sum('custo_total'))['total'] or Decimal('0.00')
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


class AlocacaoObrasEquipesSerializer(serializers.ModelSerializer):
    obra_nome = serializers.CharField(source='obra.nome_obra', read_only=True, allow_null=True)
    equipe_nome = serializers.CharField(source='equipe.nome_equipe', read_only=True, allow_null=True)
    # You could also add lider_nome for the equipe if needed:
    # lider_equipe_nome = serializers.CharField(source='equipe.lider.nome_completo', read_only=True, allow_null=True)

    class Meta:
        model = Alocacao_Obras_Equipes
        fields = '__all__'
        # If you want these extra fields to always appear, ensure they are listed or __all__ is used.
        # For more complex scenarios, consider depth or explicit field listing.

    def validate(self, data):
        # .get allows us to check for key presence without raising KeyError if not found
        # This is important because in PATCH requests, not all fields might be present.
        # However, for create (POST), we might want to ensure certain fields are present or have defaults.

        # Retrieve 'equipe' and 'servico_externo' from data.
        # If a field is not present in `data` (e.g. during a PATCH operation where it's not being updated),
        # and the field has an existing value on the instance (i.e., self.instance is not None),
        # we should use the existing instance value for validation.

        equipe = data.get('equipe', getattr(self.instance, 'equipe', None))
        servico_externo = data.get('servico_externo', getattr(self.instance, 'servico_externo', None))

        # Ensure servico_externo is stripped if it's a string, as blank strings might be passed
        if isinstance(servico_externo, str):
            servico_externo = servico_externo.strip()

        if equipe and servico_externo:
            raise serializers.ValidationError(
                "Não é possível selecionar uma equipe interna e preencher um serviço externo ao mesmo tempo. Escolha apenas um."
            )

        # This validation should only apply if both are truly empty or not provided.
        # For PATCH, if one is provided and the other is not, that's a valid update.
        # This logic is more for 'create' or if both fields are explicitly being set to empty.
        # If it's a create operation (self.instance is None) or both fields are in data:
        if self.instance is None or ('equipe' in data and 'servico_externo' in data):
             if not equipe and not servico_externo:
                raise serializers.ValidationError(
                    "É necessário selecionar uma equipe interna ou preencher o nome do serviço externo."
                )
        # If it's a PATCH operation and only one of the fields is in data, this means the other is unchanged.
        # We need to ensure that if one is being explicitly set to empty/null, the other one must have a value.
        elif 'equipe' in data and not data.get('equipe') and not servico_externo: # Trying to null out equipe
             raise serializers.ValidationError("Ao remover a equipe, é necessário preencher o serviço externo ou selecionar outra equipe.")
        elif 'servico_externo' in data and not data.get('servico_externo', '').strip() and not equipe: # Trying to null out servico_externo
             raise serializers.ValidationError("Ao remover o serviço externo, é necessário selecionar uma equipe ou preencher novamente o serviço externo.")

        return data


class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = '__all__'


class CompraSerializer(serializers.ModelSerializer):
    quantidade_disponivel = serializers.SerializerMethodField()
    material_nome = serializers.CharField(source='material.nome', read_only=True)
    obra_nome = serializers.CharField(source='obra.nome_obra', read_only=True)

    class Meta:
        model = Compra
        fields = ['id', 'obra', 'obra_nome', 'material', 'material_nome', 'quantidade', 'custo_total', 'fornecedor', 'data_compra', 'nota_fiscal', 'quantidade_disponivel']

    def get_quantidade_disponivel(self, obj):
        # obj is the Compra instance
        # Sum all 'quantidade_usada' from related UsoMaterial instances
        total_usada = obj.usos.aggregate(total=models.Sum('quantidade_usada'))['total'] or Decimal('0.00')
        disponivel = obj.quantidade - total_usada
        return disponivel


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
    material_nome = serializers.CharField(source='compra.material.nome', read_only=True, allow_null=True)
    compra_original_quantidade = serializers.DecimalField(source='compra.quantidade', max_digits=10, decimal_places=2, read_only=True)
    compra_original_custo = serializers.DecimalField(source='compra.custo_total', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = UsoMaterial
        fields = [
            'id', 'compra', 'obra', 'obra_nome', 'material_nome',
            'compra_original_quantidade', 'compra_original_custo',
            'quantidade_usada', 'data_uso', 'andar', 'categoria_uso', 'descricao'
        ]
        read_only_fields = ['obra', 'data_uso', 'obra_nome', 'material_nome', 'compra_original_quantidade', 'compra_original_custo']

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

            quantidade_disponivel_na_compra = compra_instance.quantidade - total_ja_usado_na_compra

            if self.instance: # This is an update
                # Add back the old value of quantidade_usada for this specific UsoMaterial instance
                # because it's included in total_ja_usado_na_compra.
                # This allows updating the current usage without it counting against itself.
                quantidade_disponivel_na_compra += self.instance.quantidade_usada

            if quantidade_usada > quantidade_disponivel_na_compra:
                raise serializers.ValidationError({
                    "quantidade_usada": f"A quantidade usada ({quantidade_usada}) excede a quantidade disponível ({quantidade_disponivel_na_compra}) para o material desta compra."
                })
        elif not self.instance and not compra_instance : # Create operation and compra is not provided (should be caught by field validation)
             raise serializers.ValidationError({"compra": "Este campo é obrigatório."})

        return data
