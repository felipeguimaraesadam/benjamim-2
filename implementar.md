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
- [~] 7. Investigar e corrigir loop de requests/travamento na página de Detalhes da Obra.
    - Iteração 1 (Backend):
        - Causa Identificada: Erro 500 na API `/api/usomateriais/` devido a um `FieldError` (uso incorreto de `select_related('material')`).
        - Solução Aplicada: Corrigido o `select_related` em `UsoMaterialViewSet` e atualizado `UsoMaterialSerializer` para compatibilidade com a estrutura de models e para remover referências a campos obsoletos. Método `__str__` do modelo `UsoMaterial` também atualizado.
        - Resultado: API `/api/usomateriais/` normalizada (retorna 200).
    - Iteração 2 (Frontend - Loop Persistente na Carga da Página):
        - Sintoma: Mesmo com todas as APIs retornando 200, a página entrava em loop de requests para todas as suas fontes de dados ao ser carregada.
        - Hipótese: Erros de renderização no cliente ao lidar com dados vazios (arrays `[]` retornados por algumas APIs), possivelmente causando um ciclo de re-renderização via error boundaries.
        - Solução Aplicada: Revisão extensiva dos componentes filhos de `ObraDetailPage.jsx` e da própria página. Adicionadas verificações defensivas para garantir que o acesso a propriedades de dados e o mapeamento de arrays sejam feitos de forma segura, especialmente com arrays vazios ou objetos `null`. Pequenos ajustes como `parseFloat(valor || 0)` foram adicionados para robustez. A maioria dos componentes já possuía boas práticas de verificação de dados antes de renderizar.
    - Status Atual: Múltiplas causas de loops foram abordadas (erro de API backend, robustez de renderização frontend). Requer teste para confirmar se o loop de carregamento da página foi completamente resolvido.

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
