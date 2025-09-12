# Documentação do Sistema - SGO Gestão de Obras

Este documento serve como um mapa do repositório, detalhando a estrutura de pastas e o propósito de cada componente principal do sistema.

## Estrutura de Pastas e Arquivos Principais

A seguir, a estrutura de diretórios do projeto, excluindo pastas de build e distribuição.

```
.
├── .github/                 # Configurações do GitHub (templates de issue, pull request).
├── .gitignore               # Arquivos e pastas ignorados pelo Git.
├── CONTRIBUTING.md          # Diretrizes para contribuição com o projeto.
├── README.md                # README principal do projeto.
├── backend/                 # Código-fonte do backend (Django).
├── docs/                    # Documentação geral do projeto.
├── frontend/                # Código-fonte do frontend (React).
├── scripts/                 # Scripts de automação (build, deploy, etc.).
├── fix_multi_day_rentals.py # Script para corrigir aluguéis de múltiplos dias.
└── DOCUMENTATION.md         # Este arquivo de documentação.
```

## Diretrizes de Organização

Para manter o projeto organizado e evitar duplicidade, siga as seguintes diretrizes:

- **Ambiente Virtual (`.venv`):**
  - É crucial manter um único ambiente virtual para o backend. A localização exata pode variar, mas por convenção, recomenda-se criá-lo **dentro da pasta `backend`** para manter os recursos do backend encapsulados.
  - **Exemplo de criação (dentro da pasta `backend`):**
    ```bash
    cd backend
    python -m venv .venv
    ```
  - Certifique-se de que o nome `.venv` esteja no arquivo `.gitignore` na raiz do projeto para evitar que ele seja enviado ao repositório.

- **Dependências:**
  - **Backend (Python):** Todas as dependências devem ser listadas no arquivo `backend/requirements.txt`. Use `pip freeze > backend/requirements.txt` para atualizar.
  - **Frontend (JavaScript):** Todas as dependências devem ser gerenciadas pelo `npm` e estarão nos arquivos `frontend/package.json` e `frontend/package-lock.json`.

- **Arquivos Estáticos:**
  - Imagens, CSS e outros arquivos estáticos do **frontend** devem ficar em `frontend/src/assets/`.
  - O processo de build do frontend (`npm run build`) irá gerar os arquivos finais em `frontend/dist/`, que por sua vez são copiados para `backend/static_react_build/` para serem servidos pelo Django.

- **Scripts:**
  - Todos os scripts de automação (build, testes, deploy) devem ser colocados no diretório `scripts/`.

## Detalhamento dos Componentes

### `.github/`
- **Descrição:** Contém configurações específicas do GitHub para o repositório.
- **Conteúdo:**
    - `ISSUE_TEMPLATE/`: Modelos para criação de issues (bugs, features).
    - `PULL_REQUEST_TEMPLATE.md`: Modelo para submissão de Pull Requests.

### `backend/`
- **Descrição:** Aplicação Django que serve a API e a lógica de negócios do sistema.
- **Subdiretórios Importantes:**
    - `core/`: O "coração" da aplicação Django, contendo modelos, views, serializers e URLs.
        - `models.py`: Define a estrutura do banco de dados com os modelos principais da aplicação (Obra, Funcionario, Material, etc.).
        - `views.py`: Contém a lógica de negócio da aplicação. Define as `APIViews` e `ViewSets` que processam as requisições HTTP, interagem com os modelos e retornam as respostas. Inclui lógicas para CRUD, relatórios e outras operações complexas.
        - `serializers.py`: Define como os modelos do Django são convertidos para formatos como JSON. São essenciais para a API REST, validando dados de entrada e formatando dados de saída.
        - `urls/`: Contém os arquivos de roteamento da aplicação `core`.
            - `obra_urls.py`: Define as rotas específicas para o CRUD de obras, fotos e relatórios de custos.
            - `relatorio_urls.py`: Agrupa as rotas para os diversos relatórios financeiros e de desempenho.
        - `permissions.py`: Define permissões customizadas (`IsNivelAdmin`, `IsNivelGerente`) para controlar o acesso a diferentes endpoints da API, garantindo que apenas usuários autorizados possam realizar certas ações.
        - `admin.py`: Configura como os modelos são exibidos e gerenciados na interface de administração do Django.
        - `apps.py`: Arquivo de configuração da aplicação `core`.
        - `management/commands/`: Contém comandos de gerenciamento customizados que podem ser executados com `manage.py`.
        - `migrations/`: Armazena os arquivos de migração do banco de dados, que controlam as alterações no esquema do banco de dados ao longo do tempo.
            - `Usuario`: Gerencia usuários e permissões.
            - `Obra`: Detalhes sobre as obras (endereço, status, orçamento, etc.).
            - `Funcionario`: Informações sobre os funcionários.
            - `Equipe`: Agrupamento de funcionários em equipes.
            - `Locacao_Obras_Equipes`: Alocação de equipes e funcionários às obras.
            - `Material`: Catálogo de materiais de construção.
            - `Compra`: Registros de compras de materiais.
            - `ItemCompra`: Itens específicos dentro de uma compra.
    - `sgo_core/`: Contém as configurações principais do projeto Django.
        - `settings.py`: Arquivo central de configuração do projeto. Define o banco de dados, `INSTALLED_APPS`, `MIDDLEWARE`, configurações de autenticação (JWT), e outras diretrizes globais.
        - `urls.py`: O arquivo de roteamento principal do projeto. Define as URLs de nível superior, como `/admin` e `/api`, e inclui os arquivos de URL das aplicações (como `core.urls`).
        - `wsgi.py` e `asgi.py`: Pontos de entrada para servidores web compatíveis com WSGI e ASGI, respectivamente.
    - `manage.py`: Utilitário de linha de comando do Django. É usado para executar tarefas administrativas como iniciar o servidor de desenvolvimento (`runserver`), criar migrações (`makemigrations`), aplicá-las (`migrate`) e executar comandos customizados.

### `docs/`
- **Descrição:** Documentação variada sobre o projeto.
- **Conteúdo:**
    - `changelog.md`: Histórico de mudanças.
    - `implementar.md`: Notas sobre implementações.
    - `planejamento.md`: Documentos de planejamento.

### `frontend/`
- **Descrição:** Aplicação React (Vite) que serve como interface de usuário para o sistema SGO. A estrutura de pastas segue as melhores práticas para organização de projetos React, separando lógica, componentes, estilos e serviços.
- **Subdiretórios Importantes:**
    - `src/`: Código-fonte da aplicação React.
        - `main.jsx`: Ponto de entrada da aplicação React. Responsável por renderizar o componente principal (`App`), configurar os provedores de contexto (Autenticação, Tema) e inicializar bibliotecas como `react-toastify`.
        - `App.jsx`: Componente raiz que define a estrutura de rotas da aplicação usando `react-router-dom`. Mapeia as URLs para os componentes de página correspondentes e implementa rotas protegidas e de administrador.
        - `pages/`: Contém os componentes de cada página da aplicação, como:
            - `DashboardPage`: Painel inicial.
            - `ObrasPage`: Listagem e cadastro de obras.
            - `ObraDetailPage`: Detalhes de uma obra específica.
            - `FuncionariosPage`: Gerenciamento de funcionários.
            - `EquipesPage`: Gerenciamento de equipes.
            - `MateriaisPage`: Gerenciamento de materiais.
            - `LocacoesPage`: Gerenciamento de alocações.
            - `ComprasPage`: Gerenciamento de compras.
            - `RelatoriosPage`: Visualização de relatórios.
            - `UsuariosPage`: (Admin) Gerenciamento de usuários.
            - `BackupPage`: (Admin) Opções de backup.
        - `components/`: Contém componentes React reutilizáveis, organizados em subdiretórios por funcionalidade (ex: `forms`, `modals`, `tables`).
            - `Layout.jsx`: Define a estrutura visual principal da aplicação, incluindo a barra de navegação lateral e a área de conteúdo principal.
            - `ProtectedRoute.jsx`: Um componente de ordem superior que protege rotas, garantindo que apenas usuários autenticados possam acessá-las.
            - `AdminLayout.jsx`: Um layout específico para rotas de administração, garantindo que apenas usuários com nível de acesso de administrador possam acessá-las.
        - `services/`: Responsável pela comunicação com a API do backend.
            - `api.js`: Configura uma instância do `axios` com interceptadores para injetar o token de autenticação nos cabeçalhos das requisições e para tratar a expiração de tokens, atualizando-os automaticamente usando o `refreshToken`.
        - `contexts/`: Contém os contextos React da aplicação.
            - `AuthContext.jsx`: Gerencia o estado de autenticação do usuário em toda a aplicação. Lida com login, logout, armazenamento de tokens JWT e atualização automática de tokens expirados.
            - `ThemeContext.jsx`: Gerencia o tema da aplicação (claro/escuro).
        - `hooks/`: Contém hooks customizados para lógica reutilizável (ex: `useApi`, `useDebounce`).
        - `utils/`: Funções utilitárias genéricas que podem ser usadas em toda a aplicação.
        - `assets/`: Arquivos estáticos como imagens, ícones e fontes.
    - `vite.config.js`: Arquivo de configuração do Vite (bundler do frontend).

### `scripts/`
- **Descrição:** Conjunto de scripts para automatizar tarefas comuns de desenvolvimento e deploy.
- **Conteúdo:**
    - `config.bat`: Configura o ambiente de desenvolvimento completo. Instala as dependências do backend (Python) e do frontend (Node.js), e executa as migrações do banco de dados.
    - `start.bat`: Inicia os servidores de desenvolvimento do backend (Django) e do frontend (React) simultaneamente.
    - `stop.bat`: Para todos os servidores de desenvolvimento em execução (processos Python e Node).
    - `build_executable.bat`: Realiza o build do frontend, copia os arquivos estáticos para o backend e, em seguida, usa o PyInstaller para criar um executável standalone da aplicação na pasta `dist_pyinstaller`.
    - `test_executable.bat`: Executa o aplicativo a partir do executável gerado pelo `build_executable.bat`.
    - `create_distribution_package.bat`: Cria um pacote de distribuição completo na pasta `SGO_Distribution`, contendo o código-fonte do projeto e o executável pronto para ser compartilhado.
    - `run_migrations.bat`: Executa as migrações do banco de dados do Django.
    - `create_dev_superuser.bat`: Inicia o processo para criar um superusuário no ambiente de desenvolvimento.