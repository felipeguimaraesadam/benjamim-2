Plano de Implementação - SGO
Este documento organiza as próximas tarefas para o desenvolvimento do sistema, priorizadas por criticidade e impacto.
🎯 1. Crítico / Bug Urgente
[x] (BUG) Corrigir Edição de Obra: O formulário de edição de obra não está carregando os dados existentes, abrindo como um cadastro novo. Isso impede a atualização de informações cruciais.
  - Corrigido em 29/07/2024
⚙️ 2. Mudanças Estruturais e Regras de Negócio
[ ] (CORE) Reformulação do Módulo de Locação: A funcionalidade de "Alocação" será renomeada para "Locação" e reestruturada.
[x] Nomeclatura: Alterar todas as referências de "Alocação" para "Locação" no frontend e, se necessário, no backend.
  - [x] Frontend: Terminologia atualizada para "Locação" (Concluído em 29/07/2024).
  - [x] Backend: Código atualizado para "Locação" (Concluído em 29/07/2024). **Nota:** Requer execução manual de `python manage.py migrate` devido a limitações do ambiente de desenvolvimento.
[x] Locação Individual: Permitir a locação de funcionários individuais, além de equipes, diretamente na tela de locação.(feita a migração pelo arquivo .bat novo)
  - Concluído em 29/07/2024. **Nota:** Requer execução manual de `python manage.py migrate` para aplicar as migrações 0007 e 0008 devido a limitações do ambiente de desenvolvimento.
[x] Definição de Pagamento: Ao locar um funcionário ou equipe, será obrigatório definir o tipo de pagamento (diária, por metro, empreitada), o valor e, opcionalmente, uma data futura para o pagamento. (Concluído em 14/06/2025)
[x] Validação de Duplicidade: O sistema deve verificar se um funcionário já está locado em outra obra na mesma data. (Concluído em 14/06/2025)
[x] Exibir um alerta informando qual a locação e obra em conflito. (Concluído em 14/06/2025)
[x] Oferecer a opção de transferir o funcionário, removendo a locação e o custo da obra anterior e aplicando na nova para evitar pagamentos duplicados. (Concluído em 14/06/2025)
[ ] (CORE) Cadastro de Funcionário com Formas de Pagamento: O cadastro de funcionário deve suportar múltiplos tipos de contrato/pagamento.
[ ] Adicionar campos para armazenar valores pré-definidos para diária, valor por metro e valor por empreitada. Estes campos são opcionais e servirão como sugestão na tela de locação.
[ ] (CORE) Perfis de Usuário e Permissões: Atualizar as regras de acesso.
[ ] Admin: Acesso total (criação, leitura, atualização, exclusão).
[ ] Gerente: Pode adicionar e visualizar dados, mas não pode remover ou excluir registros.
✨ 3. Novas Funcionalidades
[ ] (FOTOS) Galeria de Fotos da Obra:
[ ] Permitir o upload de arquivos de imagem (PNG, JPG/JPEG) na página de detalhes da obra.
[ ] Criar uma seção de galeria para exibir as fotos de forma organizada e esteticamente agradável.
[ ] (GRÁFICO) Análise de Custo de Locação:
[ ] Na página de listagem de locações, exibir um gráfico de barras horizontais com o custo total de locações por dia (últimos 30 dias).
[ ] Implementar um filtro por obra para o gráfico (padrão: mostrar dados de todas as obras).
[ ] Adicionar um ícone de alerta (⚠️) nos dias do gráfico que não possuem nenhuma locação registrada (inclusive domingos), para sinalizar possíveis esquecimentos.
[ ] (RELATÓRIO) Folha de Pagamento Semanal:
[ ] Na página de locação, adicionar um botão "Gerar Relatório de Pagamento".
[ ] O relatório deve consolidar todas as locações da semana (ou período selecionado), de todas as obras, organizadas por funcionário.
[ ] O relatório deve respeitar as datas de pagamento futuras, não incluindo na cobrança da semana atual o que foi agendado para depois.
[ ] Antes de gerar, o sistema deve alertar sobre os dias sem locações registradas em cada obra. O usuário pode confirmar e gerar o relatório mesmo assim.
🚀 4. Melhorias Contínuas e Backlog
[ ] (MELHORIA) Filtros na Lista de Compras: Adicionar filtros por intervalo de datas e por fornecedor.
[ ] (UI) Detalhes da Locação: Adicionar um ícone em cada registro de locação na tabela para abrir um modal com todos os detalhes (obra, funcionário/equipe, tipo de pagamento, valor, data, etc.).
[ ] (MELHORIA) Alerta de Estoque Baixo: Criar um sistema de notificação ou alerta visual quando o estoque de um material atingir um nível mínimo pré-definido.
[ ] (UI) Paginação: Garantir que todas as tabelas com grande volume de dados tenham um sistema de paginação funcional.
[ ] (UI/UX) Feedback Visual: Continuar aprimorando o feedback para o usuário com toasts para sucesso/erro e spinners durante o carregamento de dados.
[x] (UTILITÁRIO) Criar script `run_migrations.bat` para facilitar a aplicação de migrações do Django.
  - Concluído em 29/07/2024.
