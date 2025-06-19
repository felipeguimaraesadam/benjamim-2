Plano de Implementação - SGO
Este documento organiza as próximas tarefas para o desenvolvimento do sistema, priorizadas por criticidade e impacto.
As tarefas foram divididas em "Backend" e "Frontend" para maior clareza.

Plano de Implementação de Tarefas
[x] Tarefa 1: Remover o campo salario do Funcionário
Justificativa: O modelo de negócio agora se baseia exclusivamente em diárias/pagamentos por serviço, tornando o campo de salário fixo obsoleto.

Backend (Django):

Model: Em backend/core/models.py, remova a linha do campo salario do modelo Funcionario.
Python

# REMOVER ESTA LINHA
salario = models.DecimalField(max_digits=10, decimal_places=2)
Serializers: Em backend/core/serializers.py, remova 'salario' da lista de fields nos serializers FuncionarioSerializer e FuncionarioDetailSerializer.
Migração: Crie e execute a migração para remover a coluna do banco de dados.
Bash

# No terminal, dentro da pasta backend com o .venv ativado
python manage.py makemigrations core -n remover_campo_salario_funcionario
python manage.py migrate
Frontend (React):

Formulário: Em frontend/src/components/forms/FuncionarioForm.jsx, remova o div que contém o label e o input para o campo "Salário".
Tabela: Em frontend/src/components/tables/FuncionariosTable.jsx, remova a coluna (<th> e <td>) referente a "Salário".
Página de Detalhes: Em frontend/src/pages/FuncionarioDetailPage.jsx, remova a linha que exibe o "Salário" nos dados pessoais.
[x] Tarefa 2: Remover a funcionalidade "Distribuir Materiais"
Justificativa: A distribuição de materiais será simplificada e incorporada diretamente no fluxo de registro de Compras, tornando a funcionalidade separada redundante.

Frontend (React):

Remover Componente de Ação: Em frontend/src/pages/ObraDetailPage.jsx, remova o componente <QuickActionsSection /> e sua lógica de chamada (handleOpenDistribuicaoModal).
Remover Componente de Formulário: Exclua o arquivo frontend/src/components/forms/DistribuicaoMaterialForm.jsx.
Limpeza de Código: Remova a importação e o estado (showDistribuicaoModal) relacionados ao modal de distribuição em frontend/src/pages/ObraDetailPage.jsx.
Backend (Django):

Análise de Impacto (Recomendação): O modelo UsoMaterial e seus componentes associados (UsoMaterialSerializer, UsoMaterialViewSet) tornam-se obsoletos com esta mudança e a Tarefa 3. Recomendo a remoção completa:
Remover Modelo: Exclua o modelo UsoMaterial de backend/core/models.py.
Remover ViewSet: Exclua a UsoMaterialViewSet de backend/core/views.py.
Remover Serializer: Exclua o UsoMaterialSerializer de backend/core/serializers.py.
Remover URL: Remova a rota usomateriais de backend/core/urls.py.
Refatorar Dependências: Em backend/core/serializers.py, remova o campo usage_history do MaterialDetailSerializer, pois ele depende do UsoMaterial.
Migração: Crie e execute uma migração para remover a tabela core_usomaterial do banco de dados.
[x] Tarefa 3: Registrar Categoria de Uso do Material na Compra
Justificativa: Simplificar a alocação de custos de material, registrando a categoria de uso diretamente no item da compra e memorizando a escolha para futuros lançamentos.

Backend (Django):

Atualizar Modelo Material: Em backend/core/models.py, adicione um campo para armazenar a categoria padrão.
Python

# Adicionar ao modelo Material
CATEGORIA_USO_CHOICES = [
    ('Geral', 'Geral'), ('Eletrica', 'Elétrica'), ('Hidraulica', 'Hidráulica'),
    ('Alvenaria', 'Alvenaria'), ('Acabamento', 'Acabamento'), ('Fundacao', 'Fundação')
]
categoria_uso_padrao = models.CharField(max_length=50, choices=CATEGORIA_USO_CHOICES, null=True, blank=True)
Atualizar Modelo ItemCompra: Adicione o campo para a categoria de uso no item da compra.
Python

# Adicionar ao modelo ItemCompra
categoria_uso = models.CharField(max_length=50, choices=Material.CATEGORIA_USO_CHOICES, null=True, blank=True)
Criar Migração: Gere e aplique as migrações para os modelos.
Bash

python manage.py makemigrations core -n adicionar_categoria_uso_compra
python manage.py migrate
Atualizar Serializers:
Em backend/core/serializers.py, adicione categoria_uso_padrao aos fields do MaterialSerializer e MaterialDetailSerializer.
Adicione categoria_uso aos fields do ItemCompraSerializer.
Atualizar Lógica de Criação: Em backend/core/views.py, na CompraViewSet, modifique o método create (ou o perform_create) para, após salvar um ItemCompra, atualizar o campo categoria_uso_padrao do Material correspondente, se uma categoria foi informada.
Python

# Exemplo de lógica para o loop de criação de itens dentro da CompraViewSet
for item_data in itens_data:
    categoria_uso = item_data.get('categoria_uso')
    material_obj = item_data.get('material') # O serializer já deve ter o objeto Material
    item = ItemCompra.objects.create(compra=compra, **item_data)

    if categoria_uso and material_obj:
        # Atualiza o padrão do material para uso futuro
        material_obj.categoria_uso_padrao = categoria_uso
        material_obj.save(update_fields=['categoria_uso_padrao'])
Frontend (React):

Atualizar Formulário de Compra: Em frontend/src/components/forms/CompraForm.jsx, dentro do componente ItemRowInternal:
Adicione uma nova coluna na tabela para "Categoria de Uso".
Adicione um campo <select> para o usuário escolher a categoria para cada item da compra. As opções devem vir das CATEGORIA_USO_CHOICES definidas no backend.
Lógica de Preenchimento Automático:
No MaterialAutocomplete.jsx, quando um material for selecionado, ele deve retornar o objeto completo, incluindo o novo campo categoria_uso_padrao.
No CompraForm.jsx, ao selecionar um material, verifique se ele possui categoria_uso_padrao e preencha automaticamente o <select> da categoria para aquele item.
Envio de Dados: Garanta que o campo categoria_uso de cada item seja incluído no payload enviado para a API ao salvar a compra.
[x] Tarefa 4: Adicionar Orçamento Previsto à Obra
Justificativa: O campo já existe no backend, mas não está disponível na interface do usuário para inserção ou edição.

Frontend (React):

Atualizar Formulário da Obra: Em frontend/src/components/forms/ObraForm.jsx:
Adicione um novo campo de input do tipo number para "Orçamento Previsto".
Atualize o estado inicial (useState), o useEffect para preencher dados iniciais, o handleChange e a lógica de handleSubmit para incluir o campo orcamento_previsto.
É importante garantir que o valor seja enviado como um número decimal para a API.
O modelo do backend (Obra) já possui o campo orcamento_previsto, portanto, nenhuma alteração no backend é necessária.
[  ] Tarefa 5: Novos Gráficos na Página de Obras
Justificativa: Fornecer uma visão geral e agregada de todas as obras, permitindo uma análise financeira mais rápida diretamente da página de listagem.

Backend (Django):

Criar Novo Endpoint de Sumarização: Em backend/core/views.py, crie uma nova APIView chamada ObrasDashboardSummaryView.
Lógica do Endpoint: Esta view deverá calcular e retornar um JSON com os seguintes dados agregados de todas as obras:
orcamento_total_geral: Soma de orcamento_previsto de todas as obras.
gasto_total_geral: Soma de custo_total_realizado de todas as obras.
gastos_por_tipo: Um objeto com a soma total de compras, locacoes e despesas_extras.
gastos_por_categoria_material: Um objeto com a soma dos custos dos ItemCompra agrupados pelo novo campo categoria_uso.
Registrar URL: Em backend/core/urls.py, adicione uma nova rota, como path('dashboard/obras-summary/', ObrasDashboardSummaryView.as_view(), name='obras-dashboard-summary'), para a nova view.
Frontend (React):

Modificar Página de Obras: Em frontend/src/pages/ObrasPage.jsx:
Crie uma nova função para buscar os dados do endpoint /api/dashboard/obras-summary/.
Adicione um novo div no topo da página para conter os três gráficos.
Use a biblioteca recharts (já instalada) para criar os componentes dos gráficos:
Gráfico 1 (Pizza): "Orçamento vs. Gasto Total". Use os dados orcamento_total_geral e gasto_total_geral.
Gráfico 2 (Barras ou Pizza): "Composição dos Gastos". Use os dados de gastos_por_tipo.
Gráfico 3 (Barras ou Pizza): "Gastos por Categoria de Material". Use os dados de gastos_por_categoria_material.
[x] Tarefa 6: Adicionar Metragem da Obra
Justificativa: Adicionar um dado fundamental da obra para permitir cálculos de custo por metro quadrado.

Backend (Django):

Atualizar Modelo: Em backend/core/models.py, adicione um novo campo ao modelo Obra.
Python

# Adicionar ao modelo Obra
area_metragem = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Área em metros quadrados (m²)")
Migração: Crie e aplique a migração.
Bash

python manage.py makemigrations core -n adicionar_metragem_obra
python manage.py migrate
Serializer: Adicione area_metragem à lista de fields do ObraSerializer.
Frontend (React):

Atualizar Formulário: Em frontend/src/components/forms/ObraForm.jsx, adicione um novo campo de input para "Metragem da Obra (m²)".
Atualize o estado e a lógica de submissão para incluir o novo campo.
[  ] Tarefa 7: Calcular e Exibir Custo por Metro Quadrado
Justificativa: Fornecer um indicador de performance chave (KPI) na página de detalhes da obra.

Backend (Django):

Atualizar Serializer: Em backend/core/serializers.py, no ObraSerializer, adicione um novo SerializerMethodField para o custo por metro.
Python

# Adicionar aos fields do ObraSerializer
# 'custo_por_metro',

# Adicionar novo método ao ObraSerializer
def get_custo_por_metro(self, obj):
    if obj.area_metragem and obj.area_metragem > 0:
        custo_realizado = self.get_custo_total_realizado(obj)
        return (custo_realizado / obj.area_metragem).quantize(Decimal('0.01'))
    return None # ou Decimal('0.00')
Frontend (React):

Atualizar Dashboard Financeiro da Obra: Em frontend/src/components/obra/FinancialDashboard.jsx:
Adicione um novo card de exibição ao lado de "Balanço Financeiro".
O título será "Custo por m²".
O valor virá do novo campo custo_por_metro do objeto obra recebido pela API. Formate-o como moeda.
Análise Adicional e Recomendações
Gestão de Estoque: O sistema atualmente não possui um mecanismo para dar baixa no estoque (quantidade_em_estoque no modelo Material). O registro de uma Compra aumenta o valor, mas nada o diminui. A remoção da funcionalidade de "Distribuir Material" torna essa lacuna mais evidente.

Recomendação: Por agora, o campo quantidade_em_estoque deve ser tratado como um valor de referência apenas. Para uma futura versão, planeje uma funcionalidade de "Requisição de Material" ou "Baixa de Estoque" para controlar o inventário de forma precisa.
Consistência dos Dados: A remoção do campo salario e a mudança na forma como o uso do material é registrado são melhorias significativas que alinham o sistema à sua forma de trabalho atual. Essas mudanças simplificarão o uso e reduzirão a complexidade do banco de dados.
