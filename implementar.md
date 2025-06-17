Plano de Implementação - SGO
Este documento organiza as próximas tarefas para o desenvolvimento do sistema, priorizadas por criticidade e impacto.
Este documento serve como um checklist para as próximas tarefas de desenvolvimento. Marque cada item como concluído (- [x]) ao finalizar a implementação.
🎯 1. Novas Funcionalidades (Páginas de Detalhes)
[x] Página de Detalhes do Funcionário
- [x] Backend: Criar endpoint /api/funcionarios/<id>/details/ que retorna o histórico completo do funcionário.
- [x] Frontend: Criar a página FuncionarioDetailPage.jsx.
- [x] Frontend: Adicionar a rota /funcionarios/:id no App.jsx.
- [x] Frontend: Exibir os dados do funcionário (obras, pagamentos, ocorrências) em seções claras.
[ ] Página de Detalhes da Equipe
[ ] Backend: Criar endpoint /api/equipes/<id>/details/ que retorna o histórico completo da equipe.
[ ] Frontend: Criar a página EquipeDetailPage.jsx.
[ ] Frontend: Adicionar a rota /equipes/:id.
[ ] Frontend: Exibir os dados da equipe (obras, desempenho) de forma detalhada.
[ ] Página de Detalhes do Material
[ ] Backend: Criar endpoint /api/materiais/<id>/details/ que retorna o histórico de uso do material.
[ ] Frontend: Criar a página MaterialDetailPage.jsx.
[ ] Frontend: Adicionar a rota /materiais/:id.
[ ] Frontend: Exibir o histórico de uso com gráficos e tabelas.
✨ 2. Melhorias de UI/UX e Consistência
[ ] Padronização de Ações em Tabelas
- [x] Substituir texto por ícones (editar, excluir) em FuncionariosPage.jsx, EquipesPage.jsx, MateriaisPage.jsx e ComprasPage.jsx.
- [x] Adicionar ícone de olho (visualizar) para navegar para as novas páginas de detalhes. (Implementado para Funcionários)
[ ] Consistência Terminológica: "Locação"
- [x] Realizar busca e substituição global de "Localização" para "Locação" ou "Locações" em todo o frontend.
[ ] Melhorias no Formulário de Locação (LocacaoForm.jsx)
- [x] Implementar o preenchimento automático da "Data Pagamento" com base na "Data de Início da Locação".
- [x] Corrigir o label "Dados Início Localização" para "Data de Início da Locação".
🐛 3. Correção de Bugs e Erros
- [x] Corrigida a abertura automática do navegador para apontar para a URL do frontend (5173) em vez do backend (8000) ao iniciar a aplicação. (backend/manage.py)
- [x] Robustecida a instalação de dependências do frontend no `config.bat` para garantir a instalação incondicional de todos os pacotes.
[ ] Correção na Listagem de Compras (ComprasPage.jsx)
- [x] Backend: Ajustar o CompraSerializer para aninhar e serializar os ItemCompra corretamente.
- [x] Frontend: Refatorar ComprasTable.jsx para lidar com a nova estrutura de dados.
- [x] Frontend: Implementar um modal de detalhes para exibir todos os itens de uma compra.
- [x] Erro na Página de Despesas (DespesasExtrasPage.jsx)
- [x] Corrigir a passagem de props para DespesaExtraForm, garantindo que obras seja sempre um array (response.data.results).
- [x] Erro na Página de Relatórios (RelatoriosPage.jsx)
- [x] Atribuir uma key estática e única para cada componente de formulário renderizado condicionalmente para evitar o erro de removeChild.
[ ] Erro de Tela em Branco ao Salvar Despesa (DespesasExtrasPage.jsx)
[ ] Investigar erro "Element type is invalid... got: undefined" que ocorre após salvar uma despesa com sucesso. A tela fica em branco, exigindo atualização manual. O problema persiste apesar de tentativas de correção focadas em `react-toastify` e `SpinnerIcon`.
- [x] Erro no Formulário de Obra (ObraForm.jsx)
- [x] Corrigir `TypeError: funcionarios.map is not a function` garantindo que a lista de funcionários seja sempre um array.
- [x] Erro na Página de Detalhes da Obra (ObraDetailPage.jsx)
- [x] Garantir que a prop usosMaterial passada para HistoricoUsoTable.jsx seja sempre um array, tratando casos de resposta nula da API com um array vazio [].
- [x] Erro na Página de Detalhes da Obra (ObraDetailPage.jsx) - Compras
- [x] Corrigir `TypeError: todasAsComprasBruto.filter is not a function` garantindo que a lista de compras seja sempre um array antes de ser filtrada ou passada para componentes filhos.
📅 4. Funcionalidades de Relatório (Pendentes)
[ ] Relatório de Pagamento de Locação (Semanal)
[ ] UI: Adicionar botão "Gerar Relatório de Pagamento" na LocacoesPage.jsx.
[ ] Modal: Criar fluxo de modais para seleção de período e pré-verificação.
[ ] API (Pré-verificação): Implementar lógica para identificar dias sem locação e medições pendentes.
[ ] API (Relatório): Implementar a geração dos dados do relatório, agrupados por obra e aplicando a regra de negócio da data de pagamento.
[ ] Frontend: Exibir o relatório final no modal.
[ ] Frontend: Adicionar a funcionalidade de exportação para CSV.
