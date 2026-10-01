# Arquitectura

```mermaid
flowchart LR
  subgraph Cliente["Navegador / PWA (GitHub Pages)"]
    UI["React 19 + Vite<br/>TanStack Query · Zustand"]
  end

  subgraph Supabase
    Auth["Auth<br/>email · Google · X"]
    DB[("Postgres + RLS")]
    ST["Storage<br/>avatars · proofs"]
    RT["Realtime<br/>notificaciones"]
    EF["Edge Functions<br/>x-oauth-* · x-verify"]
  end

  X["X API v2"]

  UI -- "anon key + JWT" --> Auth
  UI --> DB
  UI --> ST
  RT --> UI
  UI -- "invoke (JWT)" --> EF
  EF -- "service_role" --> DB
  EF -- "token del usuario<br/>(cifrado en BD)" --> X
```

Principios:

- El frontend **nunca** ve tokens de X ni la `service_role` key; solo la anon key (pública) + el JWT del usuario.
- Toda la autorización vive en **Row Level Security**. Los puntos y la verificación se calculan en BD / Edge Functions, nunca en el cliente.
- Rutas con `HashRouter` porque GitHub Pages no reescribe URLs.

## Modelo de datos (previsto)

```mermaid
erDiagram
  profiles ||--o| x_accounts : conecta
  profiles ||--o{ mission_attempts : intenta
  missions ||--o{ mission_attempts : tiene
  mission_attempts ||--o| posts : genera
  profiles ||--o{ posts : publica
  posts ||--o{ likes : recibe
  posts ||--o{ comments : recibe
  profiles ||--o{ follows : sigue
  profiles ||--o{ notifications : recibe
  profiles ||--o{ reports : reporta

  profiles {
    uuid id PK
    text username UK
    text display_name
    text avatar_url
    text bio
    text provincia
    bool x_connected
    timestamptz created_at
  }
  x_accounts {
    uuid user_id PK
    text x_user_id
    text x_username
    bytea tokens_cifrados
  }
  missions {
    uuid id PK
    text title
    text category
    text difficulty
    int points
    text verification_type
    jsonb rules
    timestamptz starts_at
    timestamptz ends_at
    bool active
  }
  mission_attempts {
    uuid id PK
    uuid user_id FK
    uuid mission_id FK
    text status
    jsonb evidence
    text photo_url
    timestamptz verified_at
  }
  posts {
    uuid id PK
    uuid user_id FK
    uuid mission_attempt_id FK
    text text
    text_array images
  }
```
