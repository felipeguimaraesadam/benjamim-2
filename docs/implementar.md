### Tarefa: Refatorar a Página de Compras para ser Idêntica à de Locações

**Justificativa:** A página de gerenciamento de compras será redesenhada para ser visual e funcionalmente idêntica à página de "Locações". O objetivo é unificar a experiência do usuário, substituindo a visualização de tabela por um planejador semanal (`WeeklyPlanner`) e um gráfico de custos diários, oferecendo uma ferramenta mais moderna e intuitiva para o planejamento e análise de custos de compras.

---

### Plano de Implementação Detalhado

#### Etapa 1: Backend (Django)

1.  **Criar Novo Endpoint para o Gráfico de Custo Diário de Compras.**
    *   **Arquivo a ser modificado:** `backend/core/views.py`
    *   **`ViewSet` a ser alterado:** `CompraViewSet`
    *   **Ação:** Implementar uma nova `action` chamada `custo_diario_chart` dentro da `CompraViewSet`. Esta `action` será uma cópia adaptada da `custo_diario_chart` já existente na `LocacaoObrasEquipesViewSet`.
    *   **Endpoint a ser criado:** `/api/compras/custo_diario_chart/`
    *   **Lógica Detalhada:**
        *   A função receberá um `obra_id` opcional como query param para filtragem.
        *   O período de consulta será fixo: os últimos 30 dias a partir da data atual.
        *   As compras (`Compra` model) serão filtradas por `data_compra` dentro deste período.
        *   As compras serão agrupadas por `data_compra` e o `valor_total_liquido` será somado para cada dia.
        *   O endpoint deverá retornar uma lista de objetos JSON, onde cada objeto representa um dia e contém os campos: `date` (no formato `YYYY-MM-DD`), `total_cost` (o custo total do dia) e `has_compras` (um booleano indicando se houve compras naquele dia). O retorno deve ser completo para todos os 30 dias, mesmo que um dia não tenha tido compras (nesse caso, `total_cost` será `0`).

---

#### Etapa 2: Frontend (React)

1.  **Criar o Novo Componente da Página de Compras.**
    *   **Ação:** Criar um novo arquivo chamado `frontend/src/pages/ComprasPlannerPage.jsx`.
    *   **Conteúdo Inicial:** Copiar todo o conteúdo de `frontend/src/pages/LocacoesPage.jsx` para o novo arquivo `ComprasPlannerPage.jsx`.
    *   **Adaptação Inicial:**
        *   Renomear o componente de `LocacoesPage` para `ComprasPlannerPage`.
        *   Realizar uma busca e substituição (case-sensitive) de "Locação" e "Locacoes" para "Compra" e "Compras" (ex: `fetchLocacoes` -> `fetchCompras`, `currentLocacao` -> `currentCompra`).
        *   Atualizar todas as chamadas de serviço da API para usar os endpoints de compras (ex: `api.getLocacoes` -> `api.getCompras`, `api.deleteLocacao` -> `api.deleteCompra`).
        *   Atualizar a chamada para o gráfico para o novo endpoint: `api.getLocacaoCustoDiarioChart` -> `api.getCompraCustoDiarioChart`. Esta função precisará ser criada no `frontend/src/services/api.js`.

2.  **Adaptar o `WeeklyPlanner` para Compras.**
    *   **Análise:** O componente `WeeklyPlanner` busca dados de locações semanais. Será necessário adaptá-lo para buscar e exibir dados de compras.
    *   **Ação Proposta:** Modificar o `WeeklyPlanner.jsx` para que aceite uma `prop` `type` (e.g., `type="locacoes"` ou `type="compras"`). A lógica interna do componente será ajustada para:
        *   Chamar o endpoint de API apropriado (`/api/locacoes-semanal/` ou um novo `/api/compras-semanal/`).
        *   Renderizar os itens de forma diferente com base no tipo.
    *   **Plano B:** Se a adaptação se mostrar muito complexa, a alternativa será criar um componente duplicado: `WeeklyPlannerCompras.jsx`. A decisão será tomada durante a implementação, mas a preferência é pela reutilização.

3.  **Adaptar Formulários e Modais.**
    *   **Ação:** A nova página usará os formulários e modais existentes de Compras, mas eles precisarão ser integrados no fluxo copiado de `LocacoesPage`.
    *   **Componentes a serem utilizados:**
        *   `CompraForm.jsx`: Será usado no lugar de `LocacaoForm.jsx`.
        *   `CompraDetailModal.jsx`: Será usado no lugar de `LocacaoDetailModal.jsx` (se um modal de detalhes for necessário).
    *   **Integração:** Assegurar que os `props` passados para `CompraForm` (como `initialData`, `onSubmit`, `onCancel`) estejam corretamente mapeados no novo `ComprasPlannerPage.jsx`.

4.  **Atualizar o Serviço de API.**
    *   **Arquivo a ser modificado:** `frontend/src/services/api.js`
    *   **Ação:** Adicionar a nova função `getCompraCustoDiarioChart` para fazer a chamada ao endpoint `/api/compras/custo_diario_chart/`. Se a opção de reutilizar o `WeeklyPlanner` for seguida, também será necessário criar uma função para buscar as compras semanais.

5.  **Atualizar a Navegação e Rotas.**
    *   **Arquivo de Rotas:** Modificar o arquivo de rotas da aplicação (provavelmente em `App.jsx` ou similar) para que o path `/compras` agora renderize o novo componente `ComprasPlannerPage.jsx` em vez do antigo `ComprasPage.jsx`.
    *   **Arquivo de Navegação:** `frontend/src/components/Navegacao.jsx`.
    *   **Ação:** Garantir que o link de navegação "Compras" aponte para a rota correta. O nome do link pode ser mantido como "Compras", mas agora ele levará à nova interface com o planner.

---

#### Etapa 3: Finalização e Limpeza

1.  **Remover Código Antigo.**
    *   Após a nova página de compras (`ComprasPlannerPage.jsx`) ser validada e estar funcionando como esperado, o arquivo da página antiga, `frontend/src/pages/ComprasPage.jsx`, e seus componentes de tabela associados (como `ComprasTable.jsx`) serão removidos do projeto para evitar código morto.

2.  **Verificação Final.**
    *   Navegar por toda a aplicação para garantir que a mudança não introduziu efeitos colaterais.
    *   Testar a funcionalidade de CRUD (Criar, Ler, Atualizar, Deletar) na nova página de compras.
    *   Verificar se os filtros e o gráfico estão funcionando corretamente.
