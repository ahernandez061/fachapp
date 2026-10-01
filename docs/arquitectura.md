# Arquitectura

```mermaid
flowchart LR
  subgraph Cliente["PWA en GitHub Pages / App Capacitor"]
    UI["React 19 + Vite<br/>TanStack Query · Zustand"]
  end

  subgraph Supabase
    Auth["Auth<br/>email · Google · X"]
    DB[("Postgres<br/>RLS · triggers · RPC")]
    ST["Storage<br/>avatars · proofs · posts · covers"]
    RT["Realtime<br/>notifications"]
    EF["Edge Functions<br/>x-oauth-start · x-oauth-callback<br/>x-verify · x-disconnect"]
  end

  X["X API v2"]

  UI -- "anon key + JWT" --> Auth
  UI -- "PostgREST / RPC" --> DB
  UI --> ST
  RT -- "websocket" --> UI
  UI -- "invoke (JWT)" --> EF
  EF -- "service_role" --> DB
  EF -- "token del usuario (AES-GCM)" --> X
  X -- "OAuth callback" --> EF
```

Principios:

- El frontend **nunca** ve tokens de X ni la `service_role` key; solo la anon key (pública) + el JWT del usuario.
- Toda la autorización vive en **Row Level Security**. Puntos, validaciones, posts automáticos, notificaciones e insignias se calculan en la BD.
- Rutas con `HashRouter` porque GitHub Pages no reescribe URLs; los OAuth vuelven a la raíz (`?code=` antes del `#`) con flujo PKCE.

## Flujo de una misión `x_auto`

```mermaid
sequenceDiagram
  actor U as Usuario
  participant A as App
  participant F as x-verify
  participant D as Postgres
  participant X as X API v2
  U->>A: Pulsa "Verificar con X"
  A->>F: POST {mission_id} + JWT
  F->>D: misión, intento previo, regla
  F->>D: ¿respuesta en caché (15 min)?
  alt sin caché
    F->>D: ¿límite diario superado?
    F->>D: token cifrado (refresca si caduca)
    F->>X: /users/me + /users/:id/tweets
    F->>D: guarda llamada (caché + contador)
  end
  F->>F: evaluateRule(regla, datos)
  F->>D: upsert mission_attempts (verified / rejected + progreso)
  D-->>D: triggers → post, notificación, insignias
  D-->>A: Realtime: notificación
  F-->>A: {status, result}
```

## Modelo de datos

```mermaid
erDiagram
  provincias ||--o{ profiles : "vive en"
  profiles ||--|| profile_private : tiene
  profiles ||--o| x_accounts : conecta
  profiles ||--o{ mission_attempts : intenta
  missions ||--o{ mission_attempts : tiene
  mission_attempts ||--o| posts : genera
  profiles ||--o{ posts : publica
  posts ||--o{ likes : recibe
  posts ||--o{ comments : recibe
  profiles ||--o{ follows : sigue
  profiles ||--o{ blocks : bloquea
  profiles ||--o{ notifications : recibe
  profiles ||--o{ reports : reporta
  profiles ||--o{ user_badges : gana
  badges ||--o{ user_badges : ""
  profiles ||--o{ push_tokens : registra

  profiles {
    uuid id PK
    text username UK
    text display_name
    text avatar_url
    text bio
    text provincia FK
    bool onboarded
    bool x_connected
    bool is_admin
  }
  profile_private {
    uuid user_id PK
    date birthdate
    timestamptz terms_accepted_at
    timestamptz x_consent_at
  }
  x_accounts {
    uuid user_id PK
    text x_user_id
    text x_username
    text access_token_enc
    text refresh_token_enc
    timestamptz expires_at
  }
  missions {
    uuid id PK
    text title
    text category
    enum difficulty
    int points
    enum verification_type
    jsonb rules
    timestamptz starts_at
    timestamptz ends_at
    bool active
  }
  mission_attempts {
    uuid id PK
    uuid user_id FK
    uuid mission_id FK
    enum status
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
    bool hidden
  }
  notifications {
    uuid id PK
    uuid user_id FK
    text type
    jsonb payload
    bool read
  }
```

Vistas y RPC: `post_feed`, `leaderboard`, `get_feed`, `get_leaderboard`, `get_profile_stats`, `complete_onboarding`, `submit_attempt`, `review_attempt`, `export_my_data`, `delete_my_account`.
