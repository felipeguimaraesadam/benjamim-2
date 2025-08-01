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
[x] Tarefa 5: Substituir Gráfico de Composição de Custos por Três Gráficos Detalhados na Página de Detalhes da Obra (ObraDetailPage)
Justificativa: Fornecer uma visão financeira mais detalhada e específica para cada obra na sua página de detalhes, substituindo uma visualização genérica anterior.

Backend (Django):
- Em `backend/core/serializers.py`, no `ObraSerializer`:
    - Adicionado o campo `gastos_por_categoria_material_obra` (via `SerializerMethodField`).
    - Implementado o método `get_gastos_por_categoria_material_obra` para calcular os custos de `ItemCompra` agrupados por `categoria_uso` para a obra específica.
    - Verificado se `get_custos_por_categoria` e `get_custo_total_realizado` (já existentes) atendem aos requisitos dos novos gráficos para uma única obra.

Frontend (React):
- Em `frontend/src/pages/ObraDetailPage.jsx`:
    - Adicionada uma nova seção com três gráficos `recharts` lado a lado, utilizando dados do objeto `obra` (que é populado pelo `ObraSerializer` atualizado):
        - Gráfico 1 (Pizza): "Orçamento vs. Gasto Total (Obra)" - compara `obra.orcamento_previsto` com `obra.custo_total_realizado`.
        - Gráfico 2 (Barras): "Composição dos Gastos (Obra)" - detalha `obra.custos_por_categoria` (Materiais, Locações, Despesas Extras).
        - Gráfico 3 (Pizza): "Gastos por Categoria de Material (Obra)" - visualiza `obra.gastos_por_categoria_material_obra`.
- Em `frontend/src/components/obra/FinancialDashboard.jsx`:
    - Removida a lógica e a renderização do gráfico de "Composição dos Custos" que existia anteriormente neste componente, para evitar duplicidade e centralizar os novos gráficos na página de detalhes.
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
[x] Tarefa 7: Calcular e Exibir Custo por Metro Quadrado
Justificativa: Fornecer um indicador de performance chave (KPI) na página de detalhes da obra.

Backend (Django):

Atualizar Serializer: Em backend/core/serializers.py, no ObraSerializer, adicione um novo SerializerMethodField para o custo por metro.
Python

# Adicionar aos fields do ObraSerializer
# 'custo_por_metro',

# Adicionar novo método ao ObraSerializer
def get_custo_por_metro(self, obj):
    if obj.area_metragem and obj.area_metragem > 0:
        custo_realizado = self.get_custo_total_realizado(obj) # Assumindo que get_custo_total_realizado já existe e funciona.
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

[x] Tarefa 1: Corrigir Salvamento de 'Categoria de Uso' na Edição de Compra
Justificativa: Ao editar uma compra, a categoria_uso de um item não estava sendo salva no banco de dados, apesar de ser selecionada na interface. Isso ocorria porque a lógica de atualização no backend não processava e salva corretamente os dados dos itens aninhados.
Backend (Django):
- Localizar o Arquivo: `backend/core/views.py`.
- Analisar a `CompraViewSet`: Encontrar a classe `CompraViewSet`. O método `update` foi refatorado.
- Refatorar o Método `update`: Substituída a lógica de atualização por uma que itera sobre os itens recebidos na requisição. Para cada item, a lógica:
    - Verifica se o item já existe (possui um `id`) para atualizá-lo (`ItemCompra.objects.get()`).
    - Se não tiver `id`, cria uma nova instância de `ItemCompra`.
    - Salva o campo `categoria_uso` para cada item (novo ou existente).
    - Adiciona a lógica que, ao salvar um `ItemCompra` (novo ou existente com `categoria_uso`), também atualiza o campo `categoria_uso_padrao` do `Material` correspondente.
    - Implementa a exclusão de itens que existiam no banco de dados mas não foram enviados na requisição de atualização.
    - Recalcula o `valor_total_bruto` e `valor_total_liquido` da `Compra` com base nos itens atualizados antes de salvar.

[x] Tarefa 2: Refatorar Layout da Página de Detalhes da Obra (Remover Abas)
Justificativa: A navegação por abas na página de detalhes da obra não era ideal. Um layout sequencial, onde cada seção é exibida uma abaixo da outra, melhora a usabilidade e a visualização das informações.
Frontend (React):
- Localizar o Arquivo: `frontend/src/pages/ObraDetailPage.jsx`.
- Remover Lógica de Abas:
    - Removido o estado `const [activeTab, setActiveTab] = useState('equipes');`.
    - Excluído o bloco `<nav>` que renderizava os botões das abas.
- Renderizar Componentes Sequencialmente:
    - Dentro do `div` principal da página, os componentes de cada seção foram renderizados diretamente, um após o outro.
    - Ordem: `<EquipesLocadasList ... />`, `<ObraPurchasesTabContent ... />`, `<div> <ObraFotosUpload ... /> <ObraGaleria ... /> </div>`, `<ObraExpensesTabContent ... />`.
    - Props necessárias foram mantidas.

[x] Tarefa 3: Corrigir Exibição do Nome da Obra na Lista de Compras
Justificativa: Na página principal "Gestão de Compras", a coluna "Obra" na tabela estava exibindo 'N/A'.
Backend (Django):
- Verificar o Serializer: Em `backend/core/serializers.py`, `CompraSerializer` já incluía `obra_nome = serializers.CharField(source='obra.nome_obra', read_only=True)`. Verificado e confirmado.
- Verificar a ViewSet: Em `backend/core/views.py`, na `CompraViewSet`, `get_queryset` já utilizava `select_related('obra')`. Verificado e confirmado.
Frontend (React):
- Analisar o Componente da Tabela: `frontend/src/components/tables/ComprasTable.jsx`. A linha `<td>{compra.obra?.nome_obra || 'N/A'}</td>` já estava correta.
- Depurar a Página: Em `frontend/src/pages/ComprasPage.jsx`, um `console.log(compras)` foi adicionado após `fetchCompras` para inspeção (para fins de diagnóstico, se o problema persistisse).
- Ação Corretiva: A configuração do backend e o acesso no frontend pareciam corretos. A tarefa foi concluída com a verificação e a adição do log para diagnóstico futuro se necessário.

[x] Tarefa 4: Implementar Histórico de Compras na Página de Detalhes do Material
Justificativa: Substituir a funcionalidade removida de "Histórico de Uso" por um histórico de compras do material.
Backend (Django):
- Criar Novo Serializer: Em `backend/core/serializers.py`, criado `ItemCompraHistorySerializer` com os campos `id`, `quantidade`, `valor_unitario`, `data_compra`, `obra_nome`, `valor_total_item`.
- Atualizar `MaterialDetailSerializer`: Adicionado `purchase_history = serializers.SerializerMethodField()` e a função `get_purchase_history` para usar o novo serializer.
- Verificar a View: `MaterialDetailAPIView` em `backend/core/views.py` já usava `MaterialDetailSerializer`.
Frontend (React):
- Criar Componente de Tabela: Criado `frontend/src/components/tables/MaterialPurchaseHistoryTable.jsx` para exibir os dados do histórico de compras.
- Atualizar a Página de Detalhes: Em `frontend/src/pages/MaterialDetailPage.jsx`:
    - Removida a antiga tabela/lógica de "Histórico de Uso".
    - Adicionado o novo componente `MaterialPurchaseHistoryTable`, passando `materialDetails.purchase_history`.
- Remover Componentes Obsoletos: Excluídos `frontend/src/components/tables/HistoricoUsoTable.jsx` e `frontend/src/components/obra/MaterialUsageHistory.jsx`.