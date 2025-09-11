## 1. Design da Arquitetura

```mermaid
graph TD
    A[Desenvolvedor Local] --> B[Git Branches]
    B --> C[Sistema Local Django+React]
    C --> D[Testes Locais]
    D --> E[Merge para Master]
    E --> F[Deploy Render]
    F --> G[Sistema Produção]
    
    H[Upload Backup] --> I[Verificação Duplicatas]
    I --> J[PostgreSQL Render]
    
    K[Anexos Locais] --> L[Migração S3]
    L --> M[AWS S3 Bucket]
    
    subgraph "Ambiente Local"
        A
        C
        D
    end
    
    subgraph "Controle de Versão"
        B
        E
    end
    
    subgraph "Produção Render"
        F
        G
        J
    end
    
    subgraph "Armazenamento AWS"
        M
    end
```

## 2. Descrição da Tecnologia

* Frontend: React\@18 + tailwindcss\@3 + vite

* Backend: Django\@4 + Django REST Framework

* Banco de Dados: PostgreSQL (Render) + SQLite (desenvolvimento local)

* Armazenamento: AWS S3 (anexos)

* Deploy: Render (automático via Git)

* Controle de Versão: Git com workflow de branches

## 3. Definições de Rotas

| Rota    | Propósito                                            |
| ------- | ---------------------------------------------------- |
| /admin  | Painel administrativo Django para gerenciamento      |
| /backup | Página de upload e migração de banco de dados        |
| /anexos | Gerenciamento de arquivos e migração para S3         |
| /docs   | Documentação interna e diretrizes de desenvolvimento |
| /tasks  | Controle e histórico de tarefas implementadas        |
| /health | Endpoint de saúde para monitoramento Render          |

## 4. Definições de API

### 4.1 API Principal

**Upload e Migração de Backup**

```
POST /api/backup/upload
```

Request:

| Nome do Parâmetro | Tipo   | Obrigatório | Descrição                                       |
| ----------------- | ------ | ----------- | ----------------------------------------------- |
| backup\_file      | file   | true        | Arquivo db.sqlite3 do cliente                   |
| merge\_strategy   | string | false       | Estratégia de merge (default: 'no\_duplicates') |

Response:

| Nome do Parâmetro | Tipo    | Descrição                                  |
| ----------------- | ------- | ------------------------------------------ |
| status            | boolean | Status da operação                         |
| duplicates\_found | integer | Número de registros duplicados encontrados |
| records\_imported | integer | Número de registros importados             |
| errors            | array   | Lista de erros encontrados                 |

**Migração de Anexos para S3**

```
POST /api/anexos/migrate-s3
```

Request:

| Nome do Parâmetro | Tipo   | Obrigatório | Descrição                 |
| ----------------- | ------ | ----------- | ------------------------- |
| source\_path      | string | true        | Caminho dos anexos locais |
| bucket\_name      | string | true        | Nome do bucket S3         |

Response:

| Nome do Parâmetro | Tipo    | Descrição                   |
| ----------------- | ------- | --------------------------- |
| status            | boolean | Status da migração          |
| files\_migrated   | integer | Número de arquivos migrados |
| total\_size       | string  | Tamanho total migrado       |

**Controle de Tarefas**

```
GET /api/tasks/history
POST /api/tasks/add
```

## 5. Diagrama da Arquitetura do Servidor

```mermaid
graph TD
    A[Cliente / Frontend React] --> B[Camada de Controller Django]
    B --> C[Camada de Service]
    C --> D[Camada de Repository]
    D --> E[(PostgreSQL Render)]
    
    C --> F[AWS S3 Service]
    F --> G[(S3 Bucket)]
    
    C --> H[Backup Service]
    H --> I[SQLite Parser]
    I --> D
    
    subgraph Servidor Django
        B
        C
        D
        H
        I
    end
    
    subgraph Serviços Externos
        E
        G
    end
```

## 6. Modelo de Dados

### 6.1 Definição do Modelo de Dados

```mermaid
erDiagram
    TASK_HISTORY ||--o{ TASK_ITEMS : contains
    BACKUP_LOG ||--o{ BACKUP_RECORDS : tracks
    ANEXO ||--o{ S3_MIGRATION : migrates
    
    TASK_HISTORY {
        uuid id PK
        string title
        text description
        date created_at
        string status
        integer week_number
    }
    
    TASK_ITEMS {
        uuid id PK
        uuid task_history_id FK
        string item_description
        boolean completed
        datetime completed_at
    }
    
    BACKUP_LOG {
        uuid id PK
        string filename
        integer records_found
        integer duplicates_skipped
        integer records_imported
        datetime uploaded_at
        text error_log
    }
    
    BACKUP_RECORDS {
        uuid id PK
        uuid backup_log_id FK
        string table_name
        string record_hash
        boolean imported
        text original_data
    }
    
    ANEXO {
        uuid id PK
        string original_path
        string s3_url
        string filename
        integer file_size
        datetime created_at
        boolean migrated_to_s3
    }
    
    S3_MIGRATION {
        uuid id PK
        uuid anexo_id FK
        string bucket_name
        string s3_key
        datetime migrated_at
        string migration_status
    }
```

### 6.2 Linguagem de Definição de Dados

**Tabela de Histórico de Tarefas (task\_history)**

```sql
-- criar tabela
CREATE TABLE task_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    week_number INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- criar índices
CREATE INDEX idx_task_history_created_at ON task_history(created_at DESC);
CREATE INDEX idx_task_history_status ON task_history(status);
CREATE INDEX idx_task_history_week ON task_history(week_number DESC);

-- dados iniciais
INSERT INTO task_history (title, description, status, week_number) VALUES
('Organização do Projeto Render', 'Implementar workflow de branches e deploy seguro', 'in_progress', 1),
('Sistema de Backup com Upload', 'Criar funcionalidade de upload e merge de banco antigo', 'pending', 1),
('Migração de Anexos para S3', 'Implementar sistema de armazenamento AWS S3', 'pending', 1);
```

**Tabela de Log de Backup (backup\_log)**

```sql
CREATE TABLE backup_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    records_found INTEGER DEFAULT 0,
    duplicates_skipped INTEGER DEFAULT 0,
    records_imported INTEGER DEFAULT 0,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    error_log TEXT,
    processing_status VARCHAR(20) DEFAULT 'processing'
);

CREATE INDEX idx_backup_log_uploaded_at ON backup_log(uploaded_at DESC);
```

**Tabela de Anexos (anexo)**

```sql
CREATE TABLE anexo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_path VARCHAR(500),
    s3_url VARCHAR(500),
    filename VARCHAR(255) NOT NULL,
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    migrated_to_s3 BOOLEAN DEFAULT FALSE,
    content_type VARCHAR(100)
);

CREATE INDEX idx_anexo_migrated ON anexo(migrated_to_s3);
CREATE INDEX idx_anexo_created_at ON anex
```

