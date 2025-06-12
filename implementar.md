# Checklist de Implementação e Correções - SGO

Este documento gerencia o fluxo de trabalho de desenvolvimento. As regras abaixo devem ser seguidas rigorosamente a cada execução.

---

### **Regras de Execução para a IA Programadora**

1.  **Seu Papel:** Você é uma IA especialista em desenvolvimento Full-Stack com conhecimento em Django/DRF e React.
2.  **Sua Missão:** Seu objetivo é ler este arquivo, encontrar a **PRIMEIRA** tarefa com o status `[ ] Pendente ⏳` na seção "Plano de Execução Sequencial".
3.  **Foco Absoluto:** Você deve executar **APENAS E EXCLUSIVamente ESTA TAREFA ENCONTRADA**. Ignore todas as outras tarefas pendentes por enquanto.
4.  **Atualização Obrigatória:** Após concluir a implementação da tarefa, você deve **ATUALIZAR ESTE ARQUIVO**. Altere o status da tarefa que você completou de `[ ] Pendente ⏳` para `[X] Concluído ✅`.
5.  **Entregáveis:** Ao final, sua resposta deve ser feito o commit e confirmado se a tarefa foi um sucesso, se foi continuar para proxima, se não, anotar bug como subtarefa e seguir com ela até terminar.

Estas regras se aplicam a cada vez que você for acionada para trabalhar neste projeto.

## Bugs a Corrigir

- [X] **B01: Erro 400 ao Salvar 'Compra'**
    - **Status:** Concluído ✅
    - **Sintoma:** Ocorria um erro de Bad Request (400) ao submeter o formulário de uma nova compra.
    - **Resolução:** O payload enviado pelo frontend em `ComprasPage.jsx` foi ajustado para corresponder à estrutura esperada pelo `CompraSerializer` no backend.

- [X] **B02: Erro 400 ao Salvar 'Ocorrência'**
    - **Status:** Concluído ✅
    - **Sintoma:** Ocorria um erro de Bad Request (400) ao submeter o formulário de uma nova ocorrência.
    - **Resolução:** Ajustado o `handleFormSubmit` em `OcorrenciasPage.jsx` para mapear os valores do select para os textos exatos esperados pelo modelo `Ocorrencia_Funcionario`.

- [X] **B03: Nomes de Funcionários em Branco no Formulário 'Ocorrência'**
    - **Status:** Concluído ✅
    - **Sintoma:** O dropdown para selecionar um funcionário no formulário de ocorrência aparecia vazio.
    - **Resolução:** A passagem da prop `funcionarios` de `OcorrenciasPage.jsx` para `OcorrenciaForm` foi corrigida.

- [X] **B04: Responsividade do Layout Principal**
    - **Status:** Concluído ✅
    - **Sintoma:** Em telas menores, o conteúdo principal não se ajustava corretamente.
    - **Resolução:** As classes de CSS responsivo em `Layout.jsx` e `Navegacao.jsx` foram ajustadas para gerenciar corretamente o `margin-left` do conteúdo principal.

- [X] **B05: Responsável da Obra Não Aparece na Listagem Principal**
    - **Status:** Concluído ✅
    - **Sintoma:** Na tabela de `ObrasPage.jsx`, a coluna "Responsável" está sempre como "Não atribuído", mesmo que um responsável tenha sido salvo.
    - **Hipótese:** A API `GET /api/obras/` pode estar usando um serializador que não inclui o `responsavel_nome`, ou o componente `ObrasTable.jsx` está tentando acessar um campo com nome incorreto.
    - **Ação:** Verificar o `ObraSerializer` e a `ObraViewSet`. É provável que o `ObraSerializer` precise ser usado na listagem ou que um serializador de lista mais simples precise incluir o `responsavel_nome`. Confirmar o nome do campo no componente `ObrasTable.jsx`.

- [X] **B06: Filtro de Sugestão no Autocomplete de Material Quebrado**
    - **Status:** Concluído ✅
    - **Sintoma:** A lista de sugestões no MaterialAutocomplete não filtra os materiais com base no texto digitado pelo usuário. Exibe todos os materiais ou uma lista não filtrada, mesmo que o texto de busca não corresponda a nenhum nome de material.
    - **Hipótese:** A API `/api/materiais/` pode não estar recebendo o parâmetro de busca (search term) corretamente, ou o endpoint no backend não está implementando a lógica de filtragem baseada nesse termo. Alternativamente, a lógica de filtragem no frontend ao receber os dados pode estar ausente ou incorreta.
    - **Ação:** Verificar a chamada da API em `MaterialAutocomplete.jsx` para garantir que o termo de busca está sendo enviado. Inspecionar a view e o serializer correspondentes no backend (provavelmente em `core/views.py` e `core/serializers.py`) para confirmar que a filtragem por nome está implementada. Ajustar frontend ou backend conforme necessário.
    - **Resolução:** O backend (`MaterialViewSet` em `core/views.py`) foi atualizado para usar `rest_framework.filters.SearchFilter`, configurado para buscar no campo `nome` do material e ordenar os resultados por nome. O frontend (`MaterialAutocomplete.jsx`) foi ajustado para enviar o termo de busca através do parâmetro `search` (ex: `/api/materiais/?search=termo`), alinhando-se com a expectativa do `SearchFilter`.

- [X] **B07: Autocomplete de Material Não Filtra Resultados**
    - **Status:** Concluído ✅
    - **Sintoma:** No formulário de 'Nova Compra', ao digitar no campo de busca de um material, a lista de sugestões não é filtrada. A API retorna sempre a lista completa de materiais, independentemente do texto inserido.
    - **Diagnóstico:** A função `getMateriais` no arquivo `frontend/src/services/api.js` está incorreta. Ela é chamada com parâmetros de busca pelo componente `MaterialAutocomplete.jsx`, mas a função descarta esses parâmetros e sempre executa um `GET /api/materiais/` sem filtros. O backend (`MaterialViewSet`) já está configurado corretamente com `SearchFilter` e espera um parâmetro `?search=...`.
    - **Plano de Ação:**
        1.  Abra o arquivo `frontend/src/services/api.js`.
        2.  Localize a função `getMateriais`.
        3.  Modifique a assinatura da função de `export const getMateriais = () => {` para `export const getMateriais = (params) => {`.
        4.  Altere a chamada do `apiClient` dentro da função de `return apiClient.get('/materiais/');` para `return apiClient.get('/materiais/', { params });`. Isso garantirá que quaisquer parâmetros de busca (como `{ search: 'termo' }`) sejam corretamente anexados à URL da requisição.
    - **Critério de Aceitação:** Após a correção, ao cadastrar uma nova compra, a digitação no campo de material deve filtrar dinamicamente a lista de sugestões, exibindo apenas os materiais correspondentes.
    - **Resolução:** Corrigida a função `getMateriais` em `frontend/src/services/api.js` para aceitar e repassar os parâmetros de busca (`params`) para a chamada da API, conforme o plano de ação especificado.

## Melhorias de Usabilidade (UI/UX)

- [X] **UX01: Checkbox para Seleção de Membros de Equipe**
    - **Status:** Concluído ✅
    - **Descrição:** Substituir o `select` múltiplo no formulário de equipes por uma lista de funcionários com checkboxes.
    - **Benefício:** Melhora significativamente a usabilidade em comparação com a seleção múltipla padrão (que exige Ctrl/Cmd + clique).
    - **Ação:** Em `EquipeForm.jsx`, renderizar a lista de `funcionarios` como uma série de `<div>` contendo um `<input type="checkbox">` e o nome do funcionário. Gerenciar o estado `membros` (array de IDs) com base nos checkboxes marcados.

- [X] **UX02: Botões para Unidade de Medida no Formulário de Material**
    - **Status:** Concluído ✅
    - **Descrição:** Em vez de um dropdown para "Unidade de Medida", exibir botões para as 4 opções principais.
    - **Benefício:** Acelera o cadastro, tornando as opções mais visíveis e acessíveis com um único clique.
    - **Ação:** Em `MaterialForm.jsx`, remover o `<select>`. Adicionar um `<div>` com 4 botões, cada um representando uma unidade. O clique em um botão atualiza o estado `formData.unidade_medida`. Aplicar estilo para destacar o botão ativo.

- [X] **UX03: Cadastro Rápido de Material no Formulário de Compra**
    - **Status:** Concluído ✅
    - **Descrição:** No `MaterialAutocomplete` dentro de `CompraForm.jsx`, se um material não for encontrado, exibir um ícone de "+" que abre um modal para cadastro rápido.
    - **Benefício:** Evita que o usuário tenha que sair do fluxo de cadastro de compra para adicionar um novo material.
    - **Ação:** Em `MaterialAutocomplete.jsx`, quando a busca não retornar resultados, exibir um botão "+". Ao clicar, abrir um modal (`MaterialForm`). Após o submit bem-sucedido no modal, o novo material deve ser automaticamente selecionado no `MaterialAutocomplete` do item da compra.
    - **Resolução:** A funcionalidade de cadastro rápido já existia. A alteração principal foi a substituição do botão de texto "+ Cadastrar Novo Material" por um botão de ícone "+" mais compacto em `MaterialAutocomplete.jsx` para alinhar com a descrição da tarefa.

- [ ] **UX04: Adição Rápida de Ocorrência na Listagem de Funcionários**
    - **Descrição:** Na tabela de `FuncionariosPage.jsx`, adicionar um botão de ação em cada linha para "Adicionar Ocorrência".
    - **Benefício:** Agiliza o processo de registro de ocorrências para um funcionário específico.
    - **Ação:** Adicionar um novo botão na `FuncionariosTable.jsx`. O clique deve abrir um modal contendo o `OcorrenciaForm`, já com o funcionário pré-selecionado e bloqueado para edição.

- [ ] **UX05: Padronização de Botões de Ação**
    - **Descrição:** Substituir os links de texto "Editar" e "Excluir" por botões com ícones em todas as tabelas de listagem, seguindo o padrão já usado em `ObrasTable.jsx`.
    - **Benefício:** Consistência visual e de interação em todo o sistema.
    - **Ação:** Atualizar os componentes `EquipesTable.jsx`, `MateriaisTable.jsx`, e `FuncionariosTable.jsx`, trocando os `<a>` ou `<button>` de texto por botões com ícones (lápis para editar, lixeira para excluir).

## Novas Funcionalidades (Features Maiores)

- [ ] **F01: Adicionar Informações de Cliente e Orçamento na Obra**
    - **Descrição:** Incluir campos para `cliente_nome` e `orcamento_previsto` no modelo e formulários de Obra.
    - **Backend:** Adicionar `cliente_nome = models.CharField(...)` e `orcamento_previsto = models.DecimalField(...)` ao `Obra` em `models.py`. Migrar o banco. Atualizar `ObraSerializer`.
    - **Frontend:** Adicionar os campos correspondentes em `ObraForm.jsx` e exibir as informações em `ObraDetailPage.jsx`.

- [ ] **F02: Sujestão de Fornecedores no Formulário de Compra**
    - **Descrição:** O campo "Fornecedor" em `CompraForm.jsx` deve salvar os nomes digitados e sugeri-los em compras futuras.
    - **Benefício:** Reduz a redigitação e padroniza os nomes dos fornecedores.
    - **Backend:** Criar um novo endpoint de API, por exemplo, `/api/fornecedores/`, que retorne uma lista de nomes distintos de fornecedores (`Compra.objects.values_list('fornecedor', flat=True).distinct()`).
    - **Frontend:** Transformar o input de "Fornecedor" em `CompraForm.jsx` em um componente de autocomplete que consome a nova API.

- [ ] **F03: Permitir Alocação de Serviços Externos**
    - **Descrição:** No formulário de alocação, permitir que o usuário escolha entre uma equipe interna ou digite o nome de um serviço terceirizado.
    - **Backend:** Adicionar `servico_externo = models.CharField(...)` ao modelo `Alocacao_Obras_Equipes`. Tornar `equipe_id` opcional (`null=True, blank=True`). Adicionar validação no `AlocacaoObrasEquipesSerializer` para garantir que ou `equipe` ou `servico_externo` seja preenchido, mas não ambos.
    - **Frontend:** Modificar `AlocacaoForm.jsx` para incluir o novo campo e a lógica de desabilitar um campo quando o outro é preenchido.

- [ ] **F04: Página de Detalhes do Funcionário**
    - **Descrição:** Criar uma nova página (`/funcionarios/:id`) que exiba um dashboard completo para cada funcionário.
    - **Conteúdo:**
        - **Informações Pessoais:** Cargo, salário, data de contratação.
        - **Histórico de Ocorrências:** Tabela com todas as suas ocorrências.
        - **Histórico de Obras:** Lista de obras em que trabalhou, com datas.
        - **Controle Financeiro:** Um novo módulo para registrar pagamentos de salários, adiantamentos, etc.
    - **Ação:** Criar `FuncionarioDetailPage.jsx`, novos endpoints de API no backend para buscar dados agregados do funcionário e um novo modelo `PagamentoFuncionario` para o controle financeiro.

- [ ] **F05: Página de Detalhes da Equipe**
    - **Descrição:** Criar uma página (`/equipes/:id`) para detalhar informações de uma equipe.
    - **Conteúdo:**
        - Lista de membros e líder.
        - Histórico de alocações em obras.
        - **Gráfico de Custo:** Um gráfico mostrando o custo médio da equipe (soma dos salários dos membros) por semana/mês para estimativas.
    - **Ação:** Criar `EquipeDetailPage.jsx` e endpoints de API para calcular e fornecer os dados agregados de custo e histórico.

- [ ] **F06: Página de Detalhes do Material**
    - **Descrição:** Criar uma página (`/materiais/:id`) para detalhar o histórico de um material.
    - **Conteúdo:**
        - Total comprado (quantidade e valor).
        - Histórico de compras (datas, quantidades, obras).
        - Gráfico de variação de preço ao longo do tempo.
    - **Ação:** Criar `MaterialDetailPage.jsx` e endpoints de API para buscar e agregar todas as compras (`ItemCompra`) relacionadas a um `Material`.

- [ ] **F07: Cálculo de Custos da Equipe no Financeiro da Obra**
    - **Descrição:** Na página de detalhes da obra, incluir uma estimativa de custo com mão de obra.
    - **Benefício:** Oferece uma visão financeira muito mais completa da obra.
    - **Cálculo:** Para cada equipe alocada na obra, somar o salário/dia de seus membros e multiplicar pelos dias de alocação.
    - **Ação:** Requer uma lógica complexa no backend (provavelmente em `ObraSerializer` ou um endpoint dedicado) para calcular este custo com base nas alocações e salários atuais dos funcionários.
