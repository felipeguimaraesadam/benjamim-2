# Sistema de Gestão de Obras (SGO)

Este projeto é um Sistema de Gestão de Obras (SGO) conforme descrito no arquivo `planejamento.md`.

## Configuração e Inicialização (Windows)

Para utilizar esta aplicação em um ambiente Windows, siga os passos abaixo:

### 1. Configuração Inicial do Ambiente (Executar uma vez)

Execute o script `config.bat` para preparar o ambiente do projeto. Este script irá:

- Verificar se Python e Node.js (com npm) estão instalados e acessíveis no PATH.
- Navegar até o diretório `backend/`, criar um ambiente virtual Python (`.venv`) se não existir, ativar o ambiente e instalar as dependências listadas em `requirements.txt`.
- Executar as migrações do banco de dados Django para configurar o schema inicial.
- Navegar até o diretório `frontend/` e instalar as dependências Node.js listadas em `package.json` (se a pasta `node_modules` não existir).

```batch
.\config.bat
```

Certifique-se de que o `config.bat` foi executado sem erros antes de prosseguir.

### 2. Iniciando a Aplicação

Após a configuração bem-sucedida do ambiente com `config.bat`, execute o script `start.bat` para iniciar os servidores de backend e frontend:

```batch
.\start.bat
```

Este script tentará iniciar:

- O servidor de desenvolvimento Django (backend) em uma janela minimizada. Geralmente acessível em `http://localhost:8000`.
- O servidor de desenvolvimento Vite/React (frontend) em uma janela minimizada. Geralmente acessível em `http://localhost:5173` e, na maioria das vezes, abrirá automaticamente uma aba no seu navegador padrão.

Aguarde alguns instantes para que ambos os servidores sejam totalmente inicializados. Se o navegador não abrir para o frontend, acesse a URL manualmente.

README.md updated to reflect config.bat and new start.bat workflow.
