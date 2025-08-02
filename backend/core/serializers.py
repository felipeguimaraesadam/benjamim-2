from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import Usuario, Obra, Funcionario, Equipe, Locacao_Obras_Equipes, Material, Compra, Despesa_Extra, Ocorrencia_Funcionario, ItemCompra, FotoObra, Backup, BackupSettings
from django.db.models import Sum, Q
from django.db.models.functions import TruncMonth
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
        user = Usuario.objects.create_user(**validated_data)
        return user

    def update(self, instance, validated_data):
        if 'password' in validated_data:
            instance.set_password(validated_data.pop('password'))
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
        token['login'] = user.login
        token['nome_completo'] = user.nome_completo
        token['nivel_acesso'] = user.nivel_acesso
        return token

# --- Reordered Serializers ---

# Helper/Nested Serializers defined first
class ObraNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Obra
        fields = ['id', 'nome_obra']

class ItemCompraSerializer(serializers.ModelSerializer):
    material_nome = serializers.CharField(source='material.nome', read_only=True)
    class Meta:
        model = ItemCompra
        fields = ['id', 'material', 'material_nome', 'quantidade', 'valor_unitario', 'valor_total_item', 'categoria_uso']

class FuncionarioBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Funcionario
        fields = ['id', 'nome_completo']

class EquipeComMembrosBasicSerializer(serializers.ModelSerializer):
    membros = FuncionarioBasicSerializer(many=True, read_only=True)
    lider = FuncionarioBasicSerializer(read_only=True, allow_null=True)
    class Meta:
        model = Equipe
        fields = ['id', 'nome_equipe', 'lider', 'membros']

# Main serializers that might be used as nested serializers
class CompraSerializer(serializers.ModelSerializer):
    itens = ItemCompraSerializer(many=True)
    obra = ObraNestedSerializer(read_only=True)

    class Meta:
        model = Compra
        fields = [
            'id', 'obra', 'fornecedor', 'data_compra', 'data_pagamento',
            'nota_fiscal', 'valor_total_bruto', 'desconto', 'valor_total_liquido',
            'observacoes', 'itens', 'created_at', 'updated_at', 'tipo'
        ]
        extra_kwargs = {
            'created_at': {'read_only': True},
            'updated_at': {'read_only': True}
        }

    def create(self, validated_data):
        itens_data = validated_data.pop('itens')
        compra = Compra.objects.create(**validated_data)
        for item_data in itens_data:
            ItemCompra.objects.create(compra=compra, **item_data)
        total_bruto_calculado = sum(item.valor_total_item for item in compra.itens.all())
        compra.valor_total_bruto = total_bruto_calculado if total_bruto_calculado is not None else Decimal('0.00')
        compra.save()
        return compra

class DespesaExtraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Despesa_Extra
        fields = '__all__'

class LocacaoObrasEquipesSerializer(serializers.ModelSerializer):
    obra_nome = serializers.CharField(source='obra.nome_obra', read_only=True)
    equipe_nome = serializers.CharField(source='equipe.nome_equipe', read_only=True)
    funcionario_locado_nome = serializers.CharField(source='funcionario_locado.nome_completo', read_only=True)
    equipe_details = EquipeComMembrosBasicSerializer(source='equipe', read_only=True)
    tipo = serializers.SerializerMethodField()
    recurso_nome = serializers.SerializerMethodField()

    class Meta:
        model = Locacao_Obras_Equipes
        fields = [
            'id', 'obra', 'obra_nome', 'equipe', 'equipe_nome', 'equipe_details',
            'funcionario_locado', 'funcionario_locado_nome', 'servico_externo',
            'data_locacao_inicio', 'data_locacao_fim', 'tipo_pagamento',
            'valor_pagamento', 'data_pagamento', 'status_locacao', 'observacoes',
            'tipo', 'recurso_nome'
        ]
        read_only_fields = ('status_locacao', 'obra_nome', 'funcionario_locado_nome', 'equipe_nome', 'equipe_details', 'tipo', 'recurso_nome')

    def get_tipo(self, obj):
        if obj.funcionario_locado: return "funcionario"
        if obj.equipe: return "equipe"
        if obj.servico_externo: return "servico_externo"
        return None

    def get_recurso_nome(self, obj):
        if obj.funcionario_locado: return obj.funcionario_locado.nome_completo
        if obj.equipe: return obj.equipe.nome_equipe
        if obj.servico_externo: return obj.servico_externo
        return None

    def validate_valor_pagamento(self, value):
        if value is not None and value < Decimal('0.00'):
            raise serializers.ValidationError("O valor do pagamento não pode ser negativo.")
        return value

    def validate(self, data):
        equipe = data.get('equipe', getattr(self.instance, 'equipe', None))
        funcionario_locado = data.get('funcionario_locado', getattr(self.instance, 'funcionario_locado', None))
        servico_externo_str = data.get('servico_externo', getattr(self.instance, 'servico_externo', None))
        servico_externo = servico_externo_str.strip() if isinstance(servico_externo_str, str) else None

        active_fields_count = sum(1 for field_val in [equipe, funcionario_locado, servico_externo] if field_val)
        if active_fields_count == 0:
            raise serializers.ValidationError("É necessário selecionar uma equipe, um funcionário OU preencher o serviço externo.")
        if active_fields_count > 1:
            raise serializers.ValidationError("Não é possível definir uma equipe, um funcionário E um serviço externo ao mesmo tempo. Escolha apenas um.")

        data_locacao_inicio = data.get('data_locacao_inicio', getattr(self.instance, 'data_locacao_inicio', None))
        data_locacao_fim = data.get('data_locacao_fim', getattr(self.instance, 'data_locacao_fim', None))

        if funcionario_locado and data_locacao_inicio:
            effective_data_locacao_fim = data_locacao_fim or data_locacao_inicio
            q_conditions = Q(data_locacao_inicio__lte=effective_data_locacao_fim) & Q(data_locacao_fim__gte=data_locacao_inicio)
            conflicting_locacoes_qs = Locacao_Obras_Equipes.objects.filter(funcionario_locado=funcionario_locado).filter(q_conditions)
            if self.instance and self.instance.pk:
                conflicting_locacoes_qs = conflicting_locacoes_qs.exclude(pk=self.instance.pk)
            if conflicting_locacoes_qs.exists():
                first_conflict = conflicting_locacoes_qs.first()
                raise serializers.ValidationError({
                    'funcionario_locado': f"Este funcionário já está locado na obra '{first_conflict.obra.nome_obra}' de {first_conflict.data_locacao_inicio.strftime('%d/%m/%Y')} até {first_conflict.data_locacao_fim.strftime('%d/%m/%Y')}.",
                    'conflict_details': {'locacao_id': first_conflict.id}
                })
        return data

# The main ObraSerializer that depends on the ones above
class ObraSerializer(serializers.ModelSerializer):
    responsavel_nome = serializers.CharField(source='responsavel.nome_completo', read_only=True)

    # Financial Summary Fields
    custo_total_realizado = serializers.SerializerMethodField()
    custos_por_categoria = serializers.SerializerMethodField()
    balanco_financeiro = serializers.SerializerMethodField()
    custo_m2 = serializers.SerializerMethodField()

    # Chart-specific data
    gastos_por_categoria_material_obra = serializers.SerializerMethodField()
    historico_custos = serializers.SerializerMethodField()
    top_materiais = serializers.SerializerMethodField()

    # Nested data for tabs
    compras = CompraSerializer(many=True, read_only=True)
    despesas_extras = DespesaExtraSerializer(many=True, read_only=True)
    locacoes = LocacaoObrasEquipesSerializer(many=True, read_only=True, source='locacao_obras_equipes_set')

    class Meta:
        model = Obra
        fields = [
            'id', 'nome_obra', 'endereco_completo', 'cidade', 'status',
            'data_inicio', 'data_prevista_fim', 'data_real_fim',
            'responsavel', 'responsavel_nome', 'cliente_nome', 'orcamento_previsto', 'area_metragem',
            'custo_total_realizado', 'custos_por_categoria', 'gastos_por_categoria_material_obra',
            'balanco_financeiro', 'custo_m2', 'historico_custos', 'top_materiais',
            'compras', 'despesas_extras', 'locacoes'
        ]

    def get_custos_por_categoria(self, obj):
        if hasattr(obj, '_cached_custos_por_categoria'):
            return obj._cached_custos_por_categoria
        custo_materiais = obj.compras.filter(tipo='COMPRA').aggregate(total=Sum('valor_total_liquido'))['total'] or Decimal('0.00')
        custo_locacoes = obj.locacao_obras_equipes_set.filter(status_locacao='ativa').aggregate(total=Sum('valor_pagamento'))['total'] or Decimal('0.00')
        custo_despesas_extras = obj.despesas_extras.aggregate(total=Sum('valor'))['total'] or Decimal('0.00')
        result = {
            'materiais': custo_materiais, 'locacoes': custo_locacoes, 'despesas_extras': custo_despesas_extras,
        }
        obj._cached_custos_por_categoria = result
        return result

    def get_custo_total_realizado(self, obj):
        custos = self.get_custos_por_categoria(obj)
        return sum(custos.values())

    def get_balanco_financeiro(self, obj):
        orcamento = obj.orcamento_previsto or Decimal('0.00')
        custo_total = self.get_custo_total_realizado(obj)
        return orcamento - custo_total

    def get_custo_m2(self, obj):
        if not obj.area_metragem or obj.area_metragem == 0:
            return Decimal('0.00')
        custo_total = self.get_custo_total_realizado(obj)
        return custo_total / obj.area_metragem

    def get_gastos_por_categoria_material_obra(self, obj):
        gastos = ItemCompra.objects.filter(compra__obra=obj, compra__tipo='COMPRA', categoria_uso__isnull=False)\
            .values('categoria_uso').annotate(total=Sum('valor_total_item')).order_by('-total')
        return {gasto['categoria_uso']: gasto['total'] for gasto in gastos}

    def get_historico_custos(self, obj):
        custos_compras = obj.compras.filter(tipo='COMPRA').annotate(mes=TruncMonth('data_compra')).values('mes').annotate(total=Sum('valor_total_liquido')).order_by('mes')
        custos_despesas = obj.despesas_extras.annotate(mes=TruncMonth('data')).values('mes').annotate(total=Sum('valor')).order_by('mes')
        custos_locacoes = obj.locacao_obras_equipes_set.filter(status_locacao='ativa').annotate(mes=TruncMonth('data_locacao_inicio')).values('mes').annotate(total=Sum('valor_pagamento')).order_by('mes')
        historico = {}
        for custo_set in [custos_compras, custos_despesas, custos_locacoes]:
            for item in custo_set:
                if item['mes'] is None: continue
                mes_str = item['mes'].strftime('%Y-%m')
                if mes_str not in historico:
                    historico[mes_str] = {'total_custo_compras': Decimal('0.00'), 'total_custo_despesas': Decimal('0.00'), 'total_custo_locacoes': Decimal('0.00')}
                if 'total_custo_compras' in item:
                    historico[mes_str]['total_custo_compras'] += item['total'] or Decimal('0.00')
                elif 'total_custo_despesas' in item:
                     historico[mes_str]['total_custo_despesas'] += item['total'] or Decimal('0.00')
                else:
                    historico[mes_str]['total_custo_locacoes'] += item['total'] or Decimal('0.00')
        resultado_final = [{'mes': mes, 'total_custo_compras': totais['total_custo_compras'], 'total_custo_despesas': totais['total_custo_despesas'], 'total_custo_locacoes': totais['total_custo_locacoes'], 'total_geral_mes': sum(totais.values())} for mes, totais in sorted(historico.items())]
        return resultado_final

    def get_top_materiais(self, obj):
        custos = ItemCompra.objects.filter(compra__obra=obj, compra__tipo='COMPRA')\
            .values('material__nome').annotate(total_custo=Sum('valor_total_item')).order_by('-total_custo')[:10]
        return [{'name': item['material__nome'], 'value': item['total_custo'] or Decimal('0.00')} for item in custos]

# --- Other Serializers ---

class FuncionarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Funcionario
        fields = ['id', 'nome_completo', 'cargo', 'data_contratacao', 'valor_diaria_padrao', 'valor_metro_padrao', 'valor_empreitada_padrao']

class EquipeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipe
        fields = '__all__'

class FotoObraSerializer(serializers.ModelSerializer):
    class Meta:
        model = FotoObra
        fields = ['id', 'obra', 'imagem', 'descricao', 'uploaded_at']
        read_only_fields = ['uploaded_at']

    def validate_obra(self, value):
        if not isinstance(value, Obra) or not Obra.objects.filter(pk=value.pk).exists():
            raise serializers.ValidationError(f"Obra with ID {value.pk} does not exist.")
        return value

    def create(self, validated_data):
        if 'imagem' not in validated_data:
            raise serializers.ValidationError({'imagem': 'No file was submitted.'})
        return FotoObra.objects.create(**validated_data)

class ItemCompraHistorySerializer(serializers.ModelSerializer):
    obra_nome = serializers.CharField(source='compra.obra.nome_obra', read_only=True)
    data_compra = serializers.DateField(source='compra.data_compra', read_only=True)

    class Meta:
        model = ItemCompra
        fields = ['id', 'quantidade', 'valor_unitario', 'data_compra', 'obra_nome', 'valor_total_item']

class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = ['id', 'nome', 'unidade_medida', 'quantidade_em_estoque', 'nivel_minimo_estoque', 'categoria_uso_padrao']

class MaterialDetailSerializer(MaterialSerializer):
    purchase_history = ItemCompraHistorySerializer(many=True, source='itens_comprados', read_only=True)

    class Meta(MaterialSerializer.Meta):
        fields = MaterialSerializer.Meta.fields + ['purchase_history']

class CompraReportSerializer(serializers.ModelSerializer):
    obra_nome = serializers.CharField(source='obra.nome_obra', read_only=True, allow_null=True)
    class Meta:
        model = Compra
        fields = ['id', 'obra', 'obra_nome', 'fornecedor', 'data_compra', 'data_pagamento', 'nota_fiscal', 'valor_total_liquido']

class OcorrenciaFuncionarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ocorrencia_Funcionario
        fields = '__all__'

class FuncionarioObraParticipadaSerializer(serializers.ModelSerializer):
    nome_obra = serializers.CharField(source='obra.nome_obra', read_only=True)
    class Meta:
        model = Locacao_Obras_Equipes
        fields = ['id', 'nome_obra', 'data_locacao_inicio', 'data_locacao_fim']

class FuncionarioPagamentoRecebidoSerializer(serializers.ModelSerializer):
    obra_nome = serializers.CharField(source='obra.nome_obra', read_only=True)
    class Meta:
        model = Locacao_Obras_Equipes
        fields = ['id', 'obra_nome', 'data_pagamento', 'valor_pagamento']

class FuncionarioDetailSerializer(FuncionarioSerializer):
    obras_participadas = FuncionarioObraParticipadaSerializer(many=True, read_only=True, source='locacoes_individuais')
    pagamentos_recebidos = FuncionarioPagamentoRecebidoSerializer(many=True, read_only=True, source='locacoes_individuais')
    ocorrencias_registradas = OcorrenciaFuncionarioSerializer(many=True, read_only=True, source='ocorrencias')

    class Meta(FuncionarioSerializer.Meta):
        fields = FuncionarioSerializer.Meta.fields + ['obras_participadas', 'pagamentos_recebidos', 'ocorrencias_registradas']

class EquipeLocacaoSerializer(serializers.ModelSerializer):
    obra_nome = serializers.CharField(source='obra.nome_obra', read_only=True)
    class Meta:
        model = Locacao_Obras_Equipes
        fields = ['id', 'obra_nome', 'data_locacao_inicio', 'data_locacao_fim', 'status_locacao']

class EquipeDetailSerializer(serializers.ModelSerializer):
    lider_nome = serializers.CharField(source='lider.nome_completo', read_only=True, allow_null=True)
    membros = FuncionarioSerializer(many=True, read_only=True)
    locacoes_participadas = EquipeLocacaoSerializer(many=True, read_only=True, source='locacao_obras_equipes_set')

    class Meta:
        model = Equipe
        fields = ['id', 'nome_equipe', 'lider', 'lider_nome', 'membros', 'locacoes_participadas']

class BackupSerializer(serializers.ModelSerializer):
    size_mb = serializers.SerializerMethodField()
    class Meta:
        model = Backup
        fields = ['id', 'filename', 'created_at', 'tipo', 'size_bytes', 'size_mb', 'description']
        read_only_fields = ['id', 'created_at', 'size_bytes']
    
    def get_size_mb(self, obj):
        if obj.size_bytes:
            return round(obj.size_bytes / (1024 * 1024), 2)
        return 0

class BackupSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BackupSettings
        fields = ['id', 'auto_backup_enabled', 'backup_time', 'retention_days', 'max_backups']
