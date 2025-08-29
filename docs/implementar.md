### Tarefa: Desenvolver a Página de Compras com Planejamento Semanal

**Justificativa:** Criar uma nova interface para o gerenciamento de compras que seja visualmente e funcionalmente idêntica à página de "Locações", oferecendo uma experiência de usuário consistente e centralizando as funcionalidades de planejamento e análise de custos de compras.

**Backend (Django):**

1.  **Criar Endpoint para Gráfico de Custo Diário de Compras:**
    *   **Arquivo:** `backend/core/views.py`
    *   **Ação:** Adicionar uma nova `action` na `CompraViewSet` para calcular o custo diário das compras nos últimos 30 dias, similar à `custo_diario_chart` da `LocacaoViewSet`.
    *   **Endpoint:** `/api/compras/custo_diario_chart/`
    *   **Lógica:**
        *   Agrupar as compras por `data_compra`.
        *   Somar o `valor_total_liquido` de todas as compras para cada dia.
        *   Retornar uma lista de objetos, cada um contendo `date` e `total_cost`.

**Frontend (React):**

1.  **Criar a Nova Página de Compras:**
    *   **Ação:** Criar um novo arquivo `frontend/src/pages/ComprasWPlannerPage.jsx`.
    *   **Conteúdo:** Copiar o conteúdo de `frontend/src/pages/LocacoesPage.jsx` e adaptar para "Compras".
        *   Renomear o componente para `ComprasWPlannerPage`.
        *   Substituir todas as ocorrências de "locacao" e "locações" por "compra" e "compras" (e.g., `locacoes` -> `compras`, `fetchLocacoes` -> `fetchCompras`).
        *   Atualizar as chamadas de API para usar os endpoints de compras (e.g., `api.getCompras`, `api.deleteCompra`).
        *   Atualizar o título do gráfico para "Custo Diário de Compras (Últimos 30 dias)" e a chamada da API para o novo endpoint `api.getCompraCustoDiarioChart`.

2.  **Adaptar o Planejador Semanal (Weekly Planner):**
    *   **Arquivo:** `frontend/src/components/WeeklyPlanner/WeeklyPlanner.jsx`
    *   **Análise:** Verificar se o componente `WeeklyPlanner` pode ser reutilizado para "compras" ou se precisa de uma versão específica.
    *   **Ação (Inicial):** Tentar reutilizar o `WeeklyPlanner` passando um `type` (e.g., "compras") como prop e adaptar a lógica interna para buscar dados de compras em vez de locações. Se a complexidade for alta, criar um `WeeklyPlannerCompras.jsx`.

3.  **Criar Formulário e Modal de Detalhes para Compras:**
    *   **Ação:** Se os componentes existentes (`CompraForm.jsx`, `CompraDetailModal.jsx`) não forem adequados para o fluxo da nova página, criar novas versões baseadas nos componentes de "Locação".
    *   **Arquivos (se necessário):**
        *   `frontend/src/components/forms/CompraPlannerForm.jsx` (copiado de `LocacaoForm.jsx`).
        *   `frontend/src/components/modals/CompraPlannerDetailModal.jsx` (copiado de `LocacaoDetailModal.jsx`).
    *   **Adaptação:** Ajustar os campos e a lógica para corresponderem ao modelo de dados de "Compra".

4.  **Atualizar a Navegação:**
    *   **Arquivo:** `frontend/src/components/Navegacao.jsx`
    *   **Ação:** Adicionar um novo link no menu de navegação para a `ComprasWPlannerPage`, com o nome "Compras (Planner)".