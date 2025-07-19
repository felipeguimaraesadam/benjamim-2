Plano de Projeto: Sistema de Gestão de Obras (SGO)
1. Visão Geral e Objetivos do Projeto
O Sistema de Gestão de Obras (SGO) será uma aplicação de desktop robusta, projetada para centralizar e simplificar o gerenciamento de projetos de construção civil. O sistema visa oferecer uma interface de usuário intuitiva e responsiva, acessível através de um executável local, garantindo que todos os dados sejam armazenados de forma segura e privada no computador do usuário.
Objetivos Principais:
Centralização: Unificar a gestão de obras, equipes, materiais e finanças em uma única plataforma.
Controle de Custos: Monitorar de forma precisa as despesas com materiais e outros gastos extras por obra.
Gestão de Recursos: Gerenciar funcionários, salários, alocação de equipes e registrar ocorrências como atrasos.
Inteligência de Negócios: Gerar relatórios detalhados e flexíveis para apoiar a tomada de decisões estratégicas.
Segurança: Garantir o acesso ao sistema apenas por usuários autenticados com senha.
Portabilidade: Ser distribuído como um único executável, sem a necessidade de o usuário instalar um servidor de banco de dados ou outras dependências.
2. Stack Tecnológica Recomendada
Para atender aos requisitos de ter uma interface web moderna ("bem bonito e responsivo") e, ao mesmo tempo, ser um programa executável local, a arquitetura recomendada é a de uma aplicação web híbrida.
Backend: Python com o framework Django.
Por quê? Django é "batteries-included" (vem com tudo pronto). Seu ORM facilita a interação com o banco de dados de forma segura, o sistema de autenticação é robusto e o Admin Panel gerado automaticamente é perfeito para manutenções rápidas nos dados.
Frontend: React (utilizando Vite como ferramenta de build).
Por quê? Permite a criação de interfaces de usuário ricas, rápidas e componentizadas. A separação entre frontend e backend resulta em um código mais limpo e fácil de manter.
Estilização: Tailwind CSS.
Por quê? É um framework utility-first que permite criar designs modernos e totalmente responsivos de forma ágil e customizável.
Banco de Dados: SQLite.
Por quê? É um banco de dados completo que salva tudo em um único arquivo local. É a solução perfeita para uma aplicação de desktop que não precisa de um servidor dedicado.
API: Django REST Framework (DRF).
Por quê? É a ferramenta padrão do ecossistema Django para criar APIs RESTful, que farão a ponte entre o backend Python e o frontend React.
Empacotamento (Executável): PyInstaller.
Por quê? Ele é capaz de "congelar" a aplicação Django inteira (o servidor Python) junto com os arquivos já construídos do frontend React em um único arquivo .exe, satisfazendo o requisito de distribuição simples.
3. Arquitetura do Sistema
O SGO funcionará como uma aplicação cliente-servidor contida em si mesma.
O usuário executa o arquivo SGO.exe.
O executável inicia um servidor web Django leve em segundo plano, operando localmente (localhost).
Simultaneamente, ele abre uma janela que renderiza a interface construída em React.
A interface React faz chamadas de API para o servidor Django local para buscar e manipular os dados do banco de dados SQLite.
Para o usuário, a experiência é a de um programa de desktop nativo e coeso.
4. Estrutura Detalhada do Banco de Dados (Schema)
Esta é a estrutura de tabelas proposta para o banco de dados sgo.sqlite, baseada nos seus requisitos.


Tabela: Usuarios
Descrição
id
Chave Primária, Autoincremento
nome_completo
Texto
login
Texto, Único
senha_hash
Texto (Hash da senha)
nivel_acesso
Texto ('admin', 'gerente')


Tabela: Funcionarios
Descrição
id
Chave Primária, Autoincremento
nome_completo
Texto
cargo
Texto
salario
Decimal
data_contratacao
Data


Tabela: Equipes
Descrição
id
Chave Primária, Autoincremento
nome_equipe
Texto, Único
lider_id
Chave Estrangeira -> Funcionarios.id
membros
Relação Muitos-para-Muitos -> Funcionarios


Tabela: Obras
Descrição
id
Chave Primária, Autoincremento
nome_obra
Texto
endereco_completo
Texto
cidade
Texto
status
Texto ('Planejada', 'Em Andamento', 'Concluída', 'Cancelada')
data_inicio
Data
data_prevista_fim
Data
data_real_fim
Data (Pode ser nulo)


Tabela: Alocacao_Obras_Equipes
(Associação entre Obras e Equipes)
id
Chave Primária, Autoincremento
obra_id
Chave Estrangeira -> Obras.id
equipe_id
Chave Estrangeira -> Equipes.id
data_alocacao_inicio
Data
data_alocacao_fim
Data (Pode ser nulo)


Tabela: Materiais
Descrição
id
Chave Primária, Autoincremento
nome
Texto, Único
unidade_medida
Texto ('un', 'm²', 'kg', 'saco')


Tabela: Compras
Descrição
id
Chave Primária, Autoincremento
obra_id
Chave Estrangeira -> Obras.id
material_id
Chave Estrangeira -> Materiais.id
quantidade
Decimal
custo_total
Decimal
fornecedor
Texto (Opcional)
data_compra
Data
nota_fiscal
Texto (Opcional)


Tabela: Despesas_Extras
Descrição
id
Chave Primária, Autoincremento
obra_id
Chave Estrangeira -> Obras.id
descricao
Texto
valor
Decimal
data
Data
categoria
Texto ('Alimentação', 'Transporte', 'Ferramentas', 'Outros')


Tabela: Ocorrencias_Funcionarios
Descrição
id
Chave Primária, Autoincremento
funcionario_id
Chave Estrangeira -> Funcionarios.id
data
Data
tipo
Texto ('Atraso', 'Falta Justificada', 'Falta não Justificada')
observacao
Texto (Opcional)

5. Módulos e Funcionalidades (Requisitos Funcionais)
Módulo 1: Segurança e Acesso
Tela de login com usuário e senha.
Validação de credenciais e controle de sessão.
Botão de Logout.
✅ Interface de Gerenciamento de Usuários (Painel Admin).
Módulo 2: Dashboard Principal
✅ Painel com visão geral e indicadores chave (KPIs): obras ativas, custos do mês, etc.
✅ Atalhos para as seções mais usadas.
Módulo 3: Gestão de Obras
✅ CRUD (Criar, Ler, Atualizar, Deletar) completo para Obras.
✅ Listagem de obras com filtros por status e busca por nome.
✅ Tela de detalhe da obra exibindo resumo financeiro, equipes e materiais.
Módulo 4: Gestão de Pessoas (Equipes e Funcionários)
✅ CRUD para Funcionários.
✅ CRUD para Equipes, com adição e remoção de membros.
✅ Interface para alocar e desalocar equipes em obras, definindo os períodos (Alocacao_Obras_Equipes).
✅ Registro de ocorrências para funcionários (atrasos, faltas).
Módulo 5: Gestão de Suprimentos
✅ CRUD para o catálogo de Materiais.
✅ CRUD para o registro de Compras, sempre associadas a uma obra.
Módulo 6: Gestão Financeira
✅ CRUD para Despesas Extras, sempre associadas a uma obra.
Módulo 7: Relatórios
✅ Exportação de Relatórios para CSV.
✅ Relatório de Compras:
✅ Filtros por período (data de início e fim).
✅ Filtros por obra específica ou todas.
✅ Filtros por material específico.
✅ Agrupamento de resultados com totais.
✅ Relatório de Desempenho de Equipes:
✅ Listar todas as obras em que uma equipe trabalhou.
✅ Histórico de alocações.
✅ Relatório Financeiro Geral de Obra:
✅ Visão consolidada para uma obra, somando todos os custos (Compras + Despesas Extras).
✅ Filtros por período.
✅ Relatório Geral do Sistema:
✅ Visão de custo total de todas as obras em um determinado período.
6. Sugestões de Funcionalidades Adicionais
Gestão de Fornecedores: Um CRUD para cadastrar fornecedores e associá-los às compras.
Anexos de Documentos: Permitir o upload de arquivos (fotos de notas fiscais, recibos, plantas) e vinculá-los a uma compra, despesa ou obra.
Linha do Tempo da Obra (Gráfico de Gantt): Uma visualização gráfica do cronograma da obra com suas etapas e dependências.
Controle de Estoque: Além de registrar a compra, permitir dar baixa nos materiais conforme são requisitados para uma obra, oferecendo uma visão do estoque disponível.
Exportação de Relatórios: Capacidade de exportar qualquer relatório para outros formatos como PDF e Excel (CSV já implementado).
7. Roteiro de Desenvolvimento (Plano de Fases)
Fase 1: Configuração e Estrutura Base
Inicializar o projeto Django e os apps (core, obras, etc.).
Inicializar o projeto React com Vite e configurar o Tailwind CSS.
Definir todos os modelos no Django (models.py) e executar a primeira migração para criar o banco de dados.
Configurar o Django Admin para visualizar e gerenciar os dados básicos.
Fase 2: Desenvolvimento do Backend (API)
Implementar a autenticação de usuários via API (login/logout).
Criar os endpoints (URLs) e a lógica da API (serializers e views) com DRF para o CRUD de cada módulo (Obras, Funcionários, etc.).
Fase 3: Desenvolvimento do Frontend e Integração
Criar a estrutura de navegação principal (menu lateral, cabeçalho).
Desenvolver a tela de Login e a lógica de autenticação no frontend.
Construir os componentes React para cada tela de CRUD, integrando com os endpoints da API criados na Fase 2.
Fase 4: Relatórios e Funcionalidades Avançadas
Desenvolver as telas de filtro para os relatórios.
Criar endpoints específicos no backend para processar e retornar os dados dos relatórios.
Exibir os dados em tabelas formatadas no frontend.
Implementar as funcionalidades adicionais escolhidas (ex: upload de arquivos).
Fase 5: Testes, Refinamento e Empacotamento
Realizar testes completos em todas as funcionalidades.
Refinar a interface do usuário e a experiência de uso.
Corrigir bugs.
Configurar o PyInstaller para empacotar a aplicação Django e o build do React em um único executável.
Testar o executável final em diferentes ambientes.
8. Conclusão
Este documento estabelece um plano sólido e abrangente para o desenvolvimento do SGO. A arquitetura e as tecnologias escolhidas visam criar um sistema moderno, estável e que atenda a todos os requisitos funcionais e não funcionais, resultando em um produto final profissional e de alta qualidade.

## Próximos Passos

Com as recentes atualizações, o sistema está mais próximo da conclusão. As próximas etapas incluem:

*   **Finalizar Detalhes da Obra:** Implementar a busca e exibição dos dados relacionados na tela de Detalhes da Obra (Compras, Despesas, Equipes), que atualmente são placeholders.
*   **Testes Abrangentes:** Realizar testes completos em todas as funcionalidades do sistema para garantir estabilidade e corrigir bugs.
*   **Refinamento da Interface:** Coletar feedback e realizar ajustes finos na interface do usuário para melhorar a experiência de uso.
*   **Empacotamento para Distribuição:** Configurar e testar o processo de empacotamento da aplicação (utilizando PyInstaller) para gerar o executável final para distribuição.
*   **Documentação do Usuário:** Criar um manual básico para o usuário final.
