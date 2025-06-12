# Checklist de Implementação e Correções - SGO

## Bugs
- [ ] 1. Corrigir erro 400 ao salvar uma nova 'Compra'.
- [ ] 2. Corrigir erro 400 ao salvar uma nova 'Ocorrência'.
- [ ] 3. Corrigir nomes de funcionários em branco no formulário de 'Ocorrência'.
- [ ] 4. Corrigir responsividade do layout em telas pequenas.
- [X] 5. Corrigir o problema de clipping (lista cortada) do MaterialAutocomplete no formulário de Compras.
    - Solução: Implementado React Portal para a lista de sugestões, garantindo que ela renderize no topo da hierarquia DOM e não seja afetada por containers com overflow.
- [~] 6. Corrigir foco inconsistente/duplo Tab-Enter ao adicionar itens de compra no formulário de Compras.
    - Status: Comportamento do foco foi tornado mais consistente. Refinamentos adicionais foram aplicados para tentar resolver a necessidade de pressionar Tab/Enter duas vezes. Requer teste para confirmar se o problema de "duas pressionadas" foi totalmente resolvido.
    - Solução Parcial: Lógica de foco refatorada usando estado `itemToFocusId` e `useEffect` com `setTimeout(0)`. Dependências do `useEffect` foram refinadas.
- [X] 7. Investigar e corrigir loop de servidor/travamento acionado por botões de ação na página de Detalhes da Obra.
    - Causa Raiz Identificada: Erro 500 na API `/api/usomateriais/` devido a um `FieldError` no backend (Django) por uso incorreto de `select_related('material')`. Este erro causava um ciclo de tentativas de fetch no frontend.
    - Solução Backend:
        - Corrigido o `select_related` em `UsoMaterialViewSet` para `select_related('compra', 'obra').prefetch_related('compra__itens__material')`.
        - Atualizado `UsoMaterialSerializer` para tratar corretamente `material_nome` (usando `SerializerMethodField` com heurística para buscar o nome do primeiro item da compra) e remover referências a campos obsoletos da `Compra` (como `quantidade`, `custo_total`). Campos como `custo_proporcional` e validação de estoque no serializador foram mantidos como placeholders ou simplificados devido a estas mudanças estruturais.
        - Atualizado o método `__str__` do modelo `UsoMaterial` para evitar erros.
    - Resultado Esperado: Resolução do erro 500 na API e, consequentemente, interrupção do loop de requests no frontend.

## Novas Funcionalidades e Melhorias
- [ ] 5. Adicionar seleção de 'Responsável' (Funcionário) ao criar/editar uma 'Obra'.
- [ ] 6. Adicionar campo para informações do 'Cliente' na 'Obra'.
- [ ] 7. Melhorar a página de 'Detalhes da Obra' com botões de ação e gráficos.
- [ ] 8. Permitir a edição completa dos dados da 'Obra', incluindo equipes e responsável.
- [ ] 9. Permitir o registro de 'Equipes Externas' ou serviços terceirizados em 'Alocações'.
- [ ] 10. Melhorar a página de 'Usuários' com um menu de ajuda sobre permissões e garantir o acesso apenas para administradores.
- [ ] 11. Adicionar gráfico de histórico de despesas na página 'Gerenciar Obras'.
- [ ] 12. Adicionar filtros e histórico de ocorrências na página 'Gestão de Ocorrências'.
- [ ] 13. Adicionar mais gráficos de dados relevantes na página de 'Detalhes da Obra'.
