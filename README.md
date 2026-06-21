# Primitivo

Sistema de beneficios y fidelización para la cafetería-panadería **Primitivo** (pan · café · cocina).
Monorepo · PWA (Expo / React Native Web) · Backend Go (Gin) · PostgreSQL.

La especificación completa está en [docs/Primitivo_Documento_Maestro.md](docs/Primitivo_Documento_Maestro.md).
Las convenciones para agentes/IA viven en [primitivo-skills/.claude/skills/](primitivo-skills/.claude/skills/).

## Estructura

```
primitivo/
├── apps/
│   ├── api/          # Backend Go + Gin (Clean Architecture, sqlc, pgx)
│   └── web/          # Frontend Expo (React Native Web) → PWA
├── packages/
│   ├── config/       # Presets compartidos de ESLint y tsconfig
│   ├── types/        # Tipos de dominio compartidos (TS)
│   ├── ui/           # Tokens del theme editorial blanco/negro
│   └── api-client/   # Cliente TS autogenerado desde el OpenAPI del backend
├── docs/             # Documento maestro de arquitectura
└── primitivo-skills/ # Claude Skills del proyecto
```

## Requisitos

| Herramienta | Versión usada | Notas |
|-------------|---------------|-------|
| Node        | 20+ (24.x)    | |
| pnpm        | 11.x          | vía corepack |
| Go          | 1.26          | en `C:\Program Files\Go\bin` |
| PostgreSQL  | 18            | servicio local `postgresql-x64-18` |
| Tools Go    | swag, sqlc, golang-migrate | instalados en `%USERPROFILE%\go\bin` |

> El monorepo usa `nodeLinker: hoisted` (en `pnpm-workspace.yaml`) porque Expo/Metro
> necesitan un `node_modules` plano para resolver las dependencias nativas.

## Puesta en marcha

```bash
# 1. Variables de entorno
cp .env.example .env          # y completar DATABASE_URL y JWT_SECRET

# 2. Dependencias JS
pnpm install

# 3. Base de datos (una vez): crear la base "primitivo" en PostgreSQL
#    createdb primitivo   (o desde pgAdmin / psql)
```

## Comandos

Desde la raíz (orquestados con Turborepo):

| Comando | Qué hace |
|---------|----------|
| `pnpm dev` | Levanta web y/o API en modo desarrollo |
| `pnpm build` | Build de todos los workspaces |
| `pnpm type-check` | `tsc` en los paquetes TS + `go build` en la API |
| `pnpm lint` | Lint de cada workspace |
| `pnpm gen:api` | Regenera el cliente TS desde el spec OpenAPI |

### Backend (`apps/api`)

```bash
pnpm --filter @primitivo/api dev        # go run ./cmd/api  (http://localhost:8080)
pnpm --filter @primitivo/api gen:spec   # swag init  → docs/ (OpenAPI)
pnpm --filter @primitivo/api sqlc       # sqlc generate
# Migraciones (con migrate en PATH):
#   migrate -path db/migrations -database "$DATABASE_URL" up
```

Healthcheck: `GET http://localhost:8080/health` → `{"status":"ok","db":"up|down"}`.

### Frontend (`apps/web`)

```bash
pnpm --filter @primitivo/web dev    # expo start --web (http://localhost:8081)
pnpm --filter @primitivo/web build  # expo export --platform web → dist/
```

## Desarrollo local (hot-reload)

El objetivo: ver los cambios del front y del back en tiempo real, **sin pushear**, con la
web apuntando a la **API local** (no a Render).

**Requisitos (una vez):**
- `go` en el PATH y las tools Go instaladas (`air` para live-reload del backend:
  `go install github.com/air-verse/air@latest`).
- `.env` en la raíz con `DATABASE_URL` (apunta a Neon o a un Postgres local) y `JWT_SECRET`.
- `apps/web/.env` con `EXPO_PUBLIC_API_URL=http://localhost:8080/api/v1` (ya incluido;
  copialo de `apps/web/.env.example` si falta). Así el front local pega a la API local.

**Dos terminales (recomendado):**

```bash
# Terminal 1 — API con recarga en caliente (recompila al guardar .go)
pnpm --filter @primitivo/api dev:watch     # air → http://localhost:8080

# Terminal 2 — Front con Fast Refresh
pnpm --filter @primitivo/web dev           # expo → http://localhost:8081
```

Guardás un archivo y se refleja solo: el front con Fast Refresh, el back recompilado por air.

> Atajo: `pnpm dev` levanta ambos a la vez (la API con `go run`, sin live-reload). Para
> recarga del backend usá `dev:watch` como arriba.

**Login local:** mismas credenciales sembradas en la base (admin) — la API local usa la
misma `DATABASE_URL`. En `localhost` el service worker no se registra, así que no hay caché
que limpiar mientras desarrollás.

**Antes de pushear:** verificá local, y cuando estés conforme, commiteás y pusheás (recién
ahí Vercel/Render publican).

### Flujo del contrato API (code-first con swaggo)

1. Anotar el handler de Gin con swaggo (`// @Summary`, `// @Router`, …).
2. `pnpm generate:client` regenera todo: corre `gen:spec` del backend (swag init →
   `apps/api/docs/swagger.json`) y luego genera el cliente TS en
   `packages/api-client/src/generated` (swagger2openapi → openapi-typescript-codegen).
3. El frontend consume `@primitivo/api-client` (nunca fetch a mano ni tipos manuales).

> La dependencia cruzada del `turbo.json` (`generate:client` → `@primitivo/api#gen:spec`)
> garantiza que el cliente siempre se genere desde un spec fresco.
