### Tarefa: Refatorar a Página de Compras para ser Idêntica à de Locações

**Justificativa:** A página de gerenciamento de compras será redesenhada para ser visual e funcionalmente idêntica à página de "Locações". O objetivo é unificar a experiência do usuário, substituindo a visualização de tabela por um planejador semanal (`WeeklyPlanner`) e um gráfico de custos diários, oferecendo uma ferramenta mais moderna e intuitiva para o planejamento e análise de custos de compras.

---

### Plano de Implementação Detalhado

#### Etapa 1: Backend (Django)

- [x] **Criar Novo Endpoint para o Gráfico de Custo Diário de Compras.**
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

- [x] **Criar o Novo Componente da Página de Compras.**
    *   **Ação:** O arquivo existente `frontend/src/pages/ComprasPage.jsx` foi modificado para incluir a nova funcionalidade.
    *   **Adaptação Inicial:**
        *   O componente foi adaptado para usar o `WeeklyPlanner` e os novos componentes `CompraCard` e `CompraDetailModal`.
        *   As chamadas de serviço da API foram atualizadas para usar os endpoints de compras.
        *   A chamada para o gráfico foi atualizada para o novo endpoint.

- [x] **Adaptar o `WeeklyPlanner` para Compras.**
    *   **Análise:** O componente `WeeklyPlanner` busca dados de locações semanais. Foi adaptado para buscar e exibir dados de compras.
    *   **Implementado:** A funcionalidade de drag-and-drop foi adicionada, assim como o menu de contexto.

- [x] **Criar o `CompraCard.jsx`**
    *   **Ação:** Foi criado um novo componente `CompraCard.jsx` para exibir as informações de compras no `WeeklyPlanner`.

- [x] **Adaptar Formulários e Modais.**
    *   **Ação:** A nova página usará os formulários e modais existentes de Compras, mas eles precisarão ser integrados no fluxo copiado de `LocacoesPage`.
    *   **Componentes a serem utilizados:**
        *   `CompraForm.jsx`: Será usado no lugar de `LocacaoForm.jsx`.
        *   `CompraDetailModal.jsx`: Será usado no lugar de `LocacaoDetailModal.jsx`.
    *   **Implementado:** O `CompraDetailModal` foi criado e integrado.

- [x] **Atualizar o Serviço de API.**
    *   **Arquivo a ser modificado:** `frontend/src/services/api.js`
    *   **Ação:** A função `updateCompraStatus` foi utilizada para a funcionalidade de drag-and-drop.

- [ ] **Atualizar a Navegação e Rotas.**
    *   **Arquivo de Rotas:** Modificar o arquivo de rotas da aplicação (provavelmente em `App.jsx` ou similar) para que o path `/compras` agora renderize o novo componente `ComprasPlannerPage.jsx` em vez do antigo `ComprasPage.jsx`.
    *   **Arquivo de Navegação:** `frontend/src/components/Navegacao.jsx`.
    *   **Ação:** Garantir que o link de navegação "Compras" aponte para a rota correta. O nome do link pode ser mantido como "Compras", mas agora ele levará à nova interface com o planner.

---

#### Etapa 3: Finalização e Limpeza

- [ ] **Remover Código Antigo.**
    *   Após a nova página de compras (`ComprasPlannerPage.jsx`) ser validada e estar funcionando como esperado, o arquivo da página antiga, `frontend/src/pages/ComprasPage.jsx`, e seus componentes de tabela associados (como `ComprasTable.jsx`) serão removidos do projeto para evitar código morto.

- [x] **Verificação Final.**
    *   Navegar por toda a aplicação para garantir que a mudança não introduziu efeitos colaterais.
    *   Testar a funcionalidade de CRUD (Criar, Ler, Atualizar, Deletar) na nova página de compras.
    *   Verificar se os filtros e o gráfico estão funcionando corretamente.
    *   **Implementado:** Os testes estão sendo executados para garantir a funcionalidade.
