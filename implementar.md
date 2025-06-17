Plano de Implementação - SGO
Este documento organiza as próximas tarefas para o desenvolvimento do sistema, priorizadas por criticidade e impacto.
🎯 1. Crítico / Bug Urgente
[x] (BUG) Corrigir Edição de Obra: O formulário de edição de obra não está carregando os dados existentes, abrindo como um cadastro novo. Isso impede a atualização de informações cruciais.
  - Corrigido em 29/07/2024
⚙️ 2. Mudanças Estruturais e Regras de Negócio
[x] (CORE) Reformulação do Módulo de Locação: A funcionalidade de "Alocação" será renomeada para "Locação" e reestruturada. (Concluído em 2024-08-02 - Sub-tarefas finalizadas anteriormente)
[x] Nomeclatura: Alterar todas as referências de "Alocação" para "Locação" no frontend e, se necessário, no backend.
  - [x] Frontend: Terminologia atualizada para "Locação" (Concluído em 29/07/2024).
  - [x] Backend: Código atualizado para "Locação" (Concluído em 29/07/2024). **Nota:** Requer execução manual de `python manage.py migrate` devido a limitações do ambiente de desenvolvimento.
[x] Locação Individual: Permitir a locação de funcionários individuais, além de equipes, diretamente na tela de locação.(feita a migração pelo arquivo .bat novo)
  - Concluído em 29/07/2024. **Nota:** Requer execução manual de `python manage.py migrate` para aplicar as migrações 0007 e 0008 devido a limitações do ambiente de desenvolvimento.
[x] Definição de Pagamento: Ao locar um funcionário ou equipe, será obrigatório definir o tipo de pagamento (diária, por metro, empreitada), o valor e, opcionalmente, uma data futura para o pagamento. (Concluído em 14/06/2025)
[x] Validação de Duplicidade: O sistema deve verificar se um funcionário já está locado em outra obra na mesma data. (Concluído em 14/06/2025)
[x] Exibir um alerta informando qual a locação e obra em conflito. (Concluído em 14/06/2025)
[x] Oferecer a opção de transferir o funcionário, removendo a locação e o custo da obra anterior e aplicando na nova para evitar pagamentos duplicados. (Concluído em 14/06/2025)
[x] (CORE) Cadastro de Funcionário com Formas de Pagamento: O cadastro de funcionário deve suportar múltiplos tipos de contrato/pagamento.
  - [x] Adicionados campos para valores padrão de diária, metro e empreitada no cadastro do funcionário e API. (Concluído em 15/06/2025)
  - [x] Implementado autopreenchimento dos valores padrão no formulário de locação ao selecionar funcionário e tipo de pagamento. (Concluído em 15/06/2025)
  - [x] Adicionada opção para atualizar o valor padrão do funcionário (com confirmação) caso o valor seja alterado no formulário de locação. (Concluído em 15/06/2025)
[x] Adicionar campos para armazenar valores pré-definidos para diária, valor por metro e valor por empreitada. Estes campos são opcionais e servirão como sugestão na tela de locação. (Concluído em 15/06/2025)
[x] (CORE) Ajuste na Duração da Locação:
  - Modificado o comportamento da `data_locacao_fim`. Se não fornecida ou anterior à data de início, é automaticamente definida como igual à `data_locacao_inicio`.
  - Realizada migração de dados para atualizar locações existentes com `data_locacao_fim` nula para refletir esta regra.
  - O campo `data_locacao_fim` agora é não-nulo no banco de dados. (Concluído em 15/06/2025)
[x] (CORE) Perfis de Usuário e Permissões: Atualizar as regras de acesso. (Concluído em 30/07/2024)
  - [x] Admin: Acesso total (criação, leitura, atualização, exclusão).
  - [x] Gerente: Pode adicionar e visualizar dados, mas não pode remover ou excluir registros.
✨ 3. Novas Funcionalidades
[x] (FOTOS) Galeria de Fotos da Obra: (Concluído em 2024-08-01)
[x] Permitir o upload de arquivos de imagem (PNG, JPG/JPEG) na página de detalhes da obra.
[x] Criar uma seção de galeria para exibir as fotos de forma organizada e esteticamente agradável.
[x] (GRÁFICO) Análise de Custo de Locação: (Concluído em 2024-08-02)
[x] Na página de listagem de locações, exibir um gráfico de barras horizontais com o custo total de locações por dia (últimos 30 dias).
[x] Implementar um filtro por obra para o gráfico (padrão: mostrar dados de todas as obras).
[x] Adicionar um ícone de alerta (⚠️) nos dias do gráfico que não possuem nenhuma locação registrada (inclusive domingos), para sinalizar possíveis esquecimentos. (Nota: Implementado com barra amarela e legenda)
[x] (RELATÓRIO) Folha de Pagamento Semanal: (Concluído em 2024-08-02)
[x] Na página de locação, adicionar um botão "Gerar Relatório de Pagamento".
[x] O relatório deve consolidar todas as locações da semana (ou período selecionado), de todas as obras, organizadas por funcionário.
[x] O relatório deve respeitar as datas de pagamento futuras, não incluindo na cobrança da semana atual o que foi agendado para depois.
[x] Antes de gerar, o sistema deve alertar sobre os dias sem locações registradas em cada obra. O usuário pode confirmar e gerar o relatório mesmo assim.
🚀 4. Melhorias Contínuas e Backlog
[x] (UI/UX Locação) Adicionar status visual (Hoje, Futura, Passada, Cancelada) com cores e ordenação customizada à lista de locações para melhor clareza. (Concluído em 14/06/2025)
[x] (FIX) Corrigida inconsistência na exibição de datas entre diferentes telas (problema de fuso horário), garantindo que `TIME_ZONE` no backend seja 'America/Sao_Paulo' e que a formatação de datas no frontend (para DD/MM/YYYY) não seja afetada pelo fuso horário do navegador. (Concluído em 15/06/2025)
[x] (MELHORIA) Filtros na Lista de Compras: Adicionar filtros por intervalo de datas e por fornecedor. (Concluído em 30/07/2024)
[x] (UI) Detalhes da Locação: Adicionar um ícone em cada registro de locação na tabela para abrir um modal com todos os detalhes (obra, funcionário/equipe, tipo de pagamento, valor, data, etc.). (Concluído em 30/07/2024)
  - [x] Adicionado campo "Observações" ao formulário de criação/edição de locação. (Concluído em 30/07/2024)
[x] (MELHORIA) Alerta de Estoque Baixo: Criar um sistema de notificação ou alerta visual quando o estoque de um material atingir um nível mínimo pré-definido. (Concluído em 2024-08-02)
[x] (UI) Paginação: Garantir que todas as tabelas com grande volume de dados tenham um sistema de paginação funcional. (Concluído em 2024-08-02)
[x] (UI/UX) Feedback Visual: Continuar aprimorando o feedback para o usuário com toasts para sucesso/erro e spinners durante o carregamento de dados. (Concluído em 2024-08-02)
[x] (UTILITÁRIO) Criar script `run_migrations.bat` para facilitar a aplicação de migrações do Django.
  - Concluído em 29/07/2024.
