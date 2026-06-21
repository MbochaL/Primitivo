# Primitivo — Documento maestro de arquitectura

**Pan · Café · Cocina** — Sistema de beneficios y fidelización
Monorepo · PWA · Backend Go · PostgreSQL

---

## Índice

1. Descripción del proyecto
2. Stack tecnológico
3. Estructura del monorepo
4. Convenciones del monorepo
5. Progressive Web App (PWA)
6. La carpeta de skills
7. Arquitectura del backend (Go)
8. Endpoints de la API
9. Roles y permisos
10. Modelo de datos (base de datos)
11. Lógica de negocio (cliente → beneficio)
12. Categorías del menú
13. Pendientes

---

## 1. Descripción del proyecto

Sistema de gestión de beneficios y fidelización para la cafetería-panadería Primitivo, desarrollado en conjunto con un socio. El sistema permite:

- Registrar clientes identificados por DNI.
- Asociar clientes a instituciones con convenios.
- Definir beneficios especiales por institución, con condiciones dinámicas (ej. "con 5 infusiones se otorga tal descuento").
- Registrar la cantidad de infusiones consumidas por cliente para habilitar beneficios.
- Registrar compras y mantener un historial por cliente.
- Un dashboard para buscar clientes por DNI, gestionar el menú, los beneficios y sus condiciones.
- Menú, beneficios y condiciones totalmente editables (dinámicos).
- Dos roles de usuario del sistema: Administrador y Operador.

El proyecto es un **monorepo**, la aplicación web se entrega como **Progressive Web App (PWA)**, y el foco inicial es **web** (con base para mobile y escritorio a futuro).

---

## 2. Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Expo (React Native + React Native Web), TypeScript |
| Entrega web | Progressive Web App (PWA) |
| Data fetching | TanStack Query (React Query) |
| Formularios | React Hook Form + Zod |
| Backend | Go + Gin |
| Acceso a datos | sqlc + pgx |
| Migraciones | golang-migrate |
| Auth | JWT + bcrypt |
| Base de datos | PostgreSQL |
| Contrato API | swaggo (OpenAPI/Swagger, code-first) → cliente TS autogenerado |
| Monorepo | Turborepo + pnpm workspaces |
| Skills IA | Claude Skills (carpeta `skills/`) |

### Notas sobre las decisiones

**Frontend (Expo):** cubre de forma oficial mobile (iOS/Android) y web. No tiene target oficial de escritorio; si más adelante se necesita app instalable, se envuelve la build web con Tauri (liviano, multiplataforma incluido Linux) o Electron. Para el arranque vamos solo con web, entregada como PWA.

**Acceso a datos (sqlc sobre ORM):** se eligió sqlc en lugar de GORM. Se escribe SQL y sqlc genera el código Go tipado. Da control total sobre las queries (importante para la transacción de compra) y cero "magia". Es además más formativo de cara al objetivo de arquitecto de software.

**Puente front-back:** como el front es TypeScript y el back es Go, no se comparten tipos de forma nativa. Se mitiga documentando la API con OpenAPI/Swagger y autogenerando el cliente TypeScript desde esa especificación.

---

## 3. Estructura del monorepo

```
primitivo/
├── apps/
│   ├── web/                        # App Expo (React Native Web) → PWA
│   │   ├── app/                    # Rutas (Expo Router)
│   │   │   ├── (auth)/
│   │   │   │   └── login.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── clientes/
│   │   │   │   ├── menu/
│   │   │   │   ├── beneficios/
│   │   │   │   └── compras/
│   │   │   └── _layout.tsx
│   │   ├── public/                 # Assets estáticos de la PWA
│   │   │   ├── manifest.json       # Web App Manifest (PWA)
│   │   │   ├── service-worker.js   # Service Worker (offline / cache)
│   │   │   ├── icon-192.png
│   │   │   ├── icon-512.png
│   │   │   └── favicon.png
│   │   ├── app.json                # Config de Expo (incluye bloque web/PWA)
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── api/                        # Backend Go (Clean Architecture)
│       ├── cmd/
│       │   └── api/
│       │       └── main.go         # Punto de entrada: arma dependencias y levanta server
│       ├── internal/               # Código privado (no importable desde afuera)
│       │   ├── config/
│       │   │   └── config.go       # Carga de variables de entorno
│       │   ├── domain/             # Entidades y reglas puras
│       │   │   ├── cliente.go
│       │   │   ├── producto.go
│       │   │   ├── beneficio.go
│       │   │   ├── condicion.go
│       │   │   ├── compra.go
│       │   │   ├── canje.go
│       │   │   ├── usuario.go
│       │   │   └── errors.go       # Errores de dominio
│       │   ├── repository/         # Interfaces + implementación Postgres
│       │   │   ├── interfaces.go
│       │   │   └── postgres/
│       │   │       ├── cliente_repo.go
│       │   │       ├── producto_repo.go
│       │   │       ├── beneficio_repo.go
│       │   │       ├── compra_repo.go
│       │   │       ├── canje_repo.go
│       │   │       └── usuario_repo.go
│       │   ├── service/            # Lógica de negocio / casos de uso
│       │   │   ├── auth_service.go
│       │   │   ├── cliente_service.go
│       │   │   ├── menu_service.go
│       │   │   ├── beneficio_service.go
│       │   │   ├── compra_service.go
│       │   │   └── canje_service.go
│       │   ├── handler/            # Capa HTTP (transport)
│       │   │   ├── auth_handler.go
│       │   │   ├── cliente_handler.go
│       │   │   ├── menu_handler.go
│       │   │   ├── beneficio_handler.go
│       │   │   ├── compra_handler.go
│       │   │   ├── canje_handler.go
│       │   │   └── dto/
│       │   │       ├── request.go
│       │   │       └── response.go
│       │   ├── middleware/
│       │   │   ├── auth.go         # Valida JWT
│       │   │   ├── rbac.go         # Control de roles (admin vs operador)
│       │   │   ├── logger.go
│       │   │   ├── recovery.go
│       │   │   └── cors.go
│       │   └── router/
│       │       └── router.go       # Mapea rutas → middlewares → handlers
│       ├── pkg/                    # Código reutilizable, potencialmente público
│       │   ├── jwt/
│       │   │   └── jwt.go
│       │   ├── hash/
│       │   │   └── password.go     # bcrypt
│       │   └── response/
│       │       └── json.go
│       ├── db/
│       │   ├── migrations/         # golang-migrate
│       │   └── queries/            # sqlc (.sql)
│       ├── docs/                   # OpenAPI/Swagger generado
│       ├── sqlc.yaml
│       ├── go.mod
│       └── Makefile
│
├── packages/                       # Código compartido entre apps
│   ├── api-client/                 # Cliente TS autogenerado desde OpenAPI
│   │   ├── src/
│   │   │   ├── generated/          # Output de openapi-typescript-codegen
│   │   │   └── index.ts
│   │   └── package.json
│   ├── types/                      # Tipos de dominio compartidos (TS)
│   │   ├── src/
│   │   │   ├── cliente.ts
│   │   │   ├── beneficio.ts
│   │   │   ├── compra.ts
│   │   │   └── index.ts
│   │   └── package.json
│   ├── ui/                         # Componentes compartidos (cards, tablas, modales)
│   │   ├── src/
│   │   └── package.json
│   └── config/                     # Configs compartidas
│       ├── eslint/
│       ├── tsconfig/
│       └── package.json
│
├── skills/                         # Claude Skills — convenciones para agentes IA
│   ├── README.md                   # Índice y guía de uso de los skills
│   ├── backend-go/
│   │   └── SKILL.md
│   ├── frontend-expo/
│   │   └── SKILL.md
│   ├── database/
│   │   └── SKILL.md
│   ├── api-contract/
│   │   └── SKILL.md
│   └── monorepo/
│       └── SKILL.md
│
├── .github/
│   └── workflows/                  # CI/CD
│       ├── web.yml
│       └── api.yml
│
├── turbo.json                      # Pipeline de Turborepo
├── pnpm-workspace.yaml             # Define los workspaces
├── package.json                    # Root: scripts y devDependencies comunes
├── .env.example
├── .gitignore
└── README.md
```

### Cómo encajan las piezas

**`apps/`** contiene las aplicaciones ejecutables: el front `web` (Expo) y el back `api` (Go). El backend Go es un workspace "opaco" para pnpm — Turborepo lo orquesta vía scripts que llaman a `make`/`go`, pero su gestión de dependencias sigue siendo `go.mod`.

**`packages/`** es el corazón compartido del monorepo:
- `api-client` — cliente TypeScript autogenerado desde el OpenAPI del backend. Cuando cambia la API, se regenera y el front tiene tipos actualizados.
- `types` — tipos de dominio que ambas apps consumen.
- `ui` — componentes reutilizables (cards del menú, tablas, modales).
- `config` — ESLint y tsconfig centralizados.

**`skills/`** — carpeta de Claude Skills. Cada `SKILL.md` documenta las convenciones de un área para que agentes de IA trabajen siguiendo las reglas sin re-explicarlas.

---

## 4. Convenciones del monorepo

### Herramientas

- **Turborepo** — orquestación de tareas con cache de builds.
- **pnpm workspaces** — gestión de dependencias JS/TS.
- **Go modules** — gestión de dependencias del backend (independiente).

### Pipeline (`turbo.json`)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".expo/**", "web-build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "type-check": {
      "dependsOn": ["^build"]
    },
    "generate:client": {
      "outputs": ["packages/api-client/src/generated/**"]
    }
  }
}
```

`^build` significa "buildeá primero las dependencias", así `packages/types` y `packages/api-client` se construyen antes que `apps/web`.

### Flujo de tipos compartidos (type-safety end-to-end)

```
Backend Go: handlers anotados con swaggo
        ↓
swag init → OpenAPI/Swagger (apps/api/docs/)
        ↓
generate:client → openapi-typescript-codegen
        ↓
packages/api-client (tipos + funciones TS)
        ↓
apps/web importa el cliente tipado
```

Un cambio en un endpoint de Go se propaga como error de TypeScript en el front si rompe el contrato.

### Convenciones generales

- **Naming de paquetes**: `@primitivo/api-client`, `@primitivo/types`, `@primitivo/ui`, `@primitivo/config`.
- **Imports compartidos**: las apps importan desde `@primitivo/*`, nunca con rutas relativas largas entre workspaces.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`) con scope opcional del workspace (`feat(web):`, `fix(api):`).

---

## 5. Progressive Web App (PWA)

La app web se entrega como PWA, configurada en tres piezas dentro de `apps/web`.

### Web App Manifest (`public/manifest.json`)

```json
{
  "name": "Primitivo — Beneficios",
  "short_name": "Primitivo",
  "description": "Sistema de fidelización y beneficios de Primitivo",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#FFFFFF",
  "theme_color": "#000000",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

Los colores (negro/blanco) respetan la estética editorial de Primitivo. `display: standalone` abre la app sin barra de navegador cuando se instala.

### Configuración en Expo (`app.json`)

```json
{
  "expo": {
    "name": "Primitivo",
    "web": {
      "favicon": "./public/favicon.png",
      "output": "static",
      "bundler": "metro"
    }
  }
}
```

`output: "static"` genera un sitio estático, ideal para servir como PWA en Vercel, Netlify o Cloudflare Pages.

### Service Worker — estrategias de cache

- **App shell** (HTML, JS, CSS): `cache-first` — la interfaz carga instantánea aunque no haya red.
- **Menú y catálogo** (cambian poco): `stale-while-revalidate` — muestra lo cacheado y actualiza en segundo plano.
- **Búsquedas por DNI, compras, canjes** (datos en vivo): `network-first` — siempre intenta datos frescos; cache solo como fallback.

### Regla de integridad para offline

El registro de **compras y canjes no debe funcionar offline de forma ingenua**. Si un operador registra una venta sin conexión y se encola para enviar después, puede haber problemas de integridad (contador de infusiones desactualizado, beneficios aplicados sobre datos viejos). Esas operaciones requieren conexión y muestran un estado claro de "sin conexión" si fallan. El offline se reserva para **lectura** (consultar menú, ver un cliente ya cargado), no para **escritura** crítica.

---

## 6. La carpeta de skills

`skills/` contiene archivos `SKILL.md` que documentan las convenciones del proyecto para agentes de IA (ej. Claude Code). Cada skill cubre un área y permite que el agente trabaje siguiendo las reglas sin re-explicarlas en cada sesión.

| Skill | Cubre |
|-------|-------|
| `backend-go/SKILL.md` | Clean Architecture, capas, sqlc, manejo de errores, inyección de dependencias, transacciones |
| `frontend-expo/SKILL.md` | Expo Router, React Native Web, configuración PWA, consumo del api-client, formularios con Zod |
| `database/SKILL.md` | Migraciones (golang-migrate), queries sqlc, naming de tablas/columnas, baja lógica |
| `api-contract/SKILL.md` | Versionado `/api/v1`, generación de OpenAPI, separación de DTOs, códigos de estado |
| `monorepo/SKILL.md` | Workspaces, pipeline Turbo, naming de paquetes, Conventional Commits |

Cada `SKILL.md` sigue el formato estándar: un frontmatter con nombre y descripción (cuándo aplicarlo), seguido del cuerpo con las convenciones concretas y ejemplos.

Ejemplo de cabecera:

```markdown
---
name: backend-go
description: Convenciones de arquitectura del backend Go de Primitivo. Usar al crear o
  editar handlers, services, repositories o middlewares; al escribir queries sqlc; o al
  definir errores de dominio. Cubre Clean Architecture, inyección de dependencias y el
  patrón de transacción de compra.
---

# Convenciones del backend Go — Primitivo

## Estructura de capas
...
```

---

## 7. Arquitectura del backend (Go)

### Filosofía: Clean Architecture / Hexagonal

Separación por capas con dependencias apuntando hacia adentro: el dominio no conoce la base de datos, la base de datos no conoce HTTP.

Capas, de afuera hacia adentro:

1. **Handler (HTTP / transport)** — recibe requests, valida formato (DTO), llama al service, devuelve JSON. Sin lógica de negocio.
2. **Service (lógica de negocio / casos de uso)** — orquesta las reglas: ¿el cliente alcanzó el umbral?, ¿este usuario puede editar el menú? Aquí vive el valor del sistema.
3. **Repository (acceso a datos)** — interfaces que abstraen Postgres. El service depende de la interfaz, no de la implementación concreta.
4. **Domain (entidades + reglas puras)** — structs y reglas que no dependen de nada externo.

Regla de oro: cada capa solo conoce la de abajo a través de una interfaz. Permite testear el service con un repositorio falso (mock) sin levantar base de datos.

### Flujo de una request (registrar una compra)

```
Router (POST /compras)
   ↓
Middlewares (recovery → logger → cors → auth → rbac)
   ↓
Handler (valida DTO, llama service)
   ↓
Service (calcula total, aplica beneficio)  ← lógica de negocio
   ↓
Repository (interfaz → sqlc/pgx)
   ↓
PostgreSQL (persiste en transacción)
   ↓
Response JSON (vuelve hacia arriba)
```

Cada capa solo conoce la de abajo a través de una interfaz: el handler no sabe que existe Postgres, el service no sabe que existe HTTP.

### Middlewares (orden de ejecución)

El orden importa; se ejecutan como una cadena de afuera hacia adentro:

1. **Recovery** — primero de todos. Atrapa cualquier panic y devuelve 500 limpio en vez de tirar el servidor.
2. **Logger** — registra método, ruta, status y latencia de cada request.
3. **CORS** — habilita las peticiones desde el front (Expo/web).
4. **Auth** — valida el JWT del header Authorization. Si es inválido → 401. Si es válido, inyecta `user_id` y `rol` en el contexto.
5. **RBAC** — solo en rutas protegidas. Lee el rol del contexto y verifica permiso. Si un operador intenta una acción de admin → 403.

Aplicación conceptual con Gin:

```go
r := gin.New()
r.Use(middleware.Recovery())
r.Use(middleware.Logger())
r.Use(middleware.CORS())

v1 := r.Group("/api/v1")

// Rutas públicas
v1.POST("/auth/login", authHandler.Login)

// Rutas protegidas (requieren JWT)
protegidas := v1.Group("")
protegidas.Use(middleware.Auth())
protegidas.GET("/clientes/dni/:dni", clienteHandler.BuscarPorDNI)

// Subgrupo solo-admin
admin := protegidas.Group("")
admin.Use(middleware.RequireRole("administrador"))
admin.POST("/productos", menuHandler.CrearProducto)
admin.POST("/beneficios", beneficioHandler.Crear)
```

### Services principales

**CompraService** es el corazón del sistema. Su método `RegistrarCompra` opera dentro de una **transacción**:

1. Recibe los productos y cantidades.
2. Busca los precios actuales en la base.
3. Calcula el subtotal.
4. Si se aplica un beneficio, valida que el cliente cumpla la condición y calcula el descuento.
5. Inserta la compra + sus detalles + el canje (si hubo).
6. Actualiza el contador de infusiones del cliente (suma las infusiones compradas; si el canje reinicia, lo pone en cero).
7. Si algo falla en cualquier paso, hace rollback de todo.

**BeneficioService** maneja la lógica dinámica: dado un cliente, evalúa sus condiciones vigentes y determina qué beneficios tiene disponibles según su contador.

### Acceso a datos: sqlc

Se eligió sqlc sobre ORM. Se escribe SQL y sqlc genera código Go tipado. Control total sobre las queries (importante para la transacción de compra) y cero "magia".

### Inyección de dependencias por constructor

Sin variables globales. `main.go` arma la cadena: pool de conexiones → repositorios → services → handlers. Todo testeable.

```go
db := postgres.NewPool(cfg.DatabaseURL)
clienteRepo := postgres.NewClienteRepo(db)
clienteService := service.NewClienteService(clienteRepo)
clienteHandler := handler.NewClienteHandler(clienteService)
```

### Otras buenas prácticas fijadas

- **Errores de dominio definidos** (`ErrClienteNoEncontrado`, `ErrUmbralNoAlcanzado`) que el handler traduce a códigos HTTP. El cliente nunca ve un error SQL crudo.
- **Context propagation.** Todo método recibe `context.Context` como primer parámetro, para timeouts y cancelación.
- **DTOs separados del dominio.** Lo que entra/sale por HTTP no es la entidad de dominio. Evita exponer campos como `password_hash`.
- **Graceful shutdown.** El server cierra conexiones limpiamente ante señales del sistema.

---

## 8. Endpoints de la API

Versionados bajo `/api/v1`. Entre paréntesis, qué rol puede acceder.

### Auth
```
POST   /api/v1/auth/login          (público)  → devuelve JWT
POST   /api/v1/auth/refresh        (público)  → renueva token
```

### Clientes (operación diaria)
```
GET    /api/v1/clientes/dni/:dni        (ambos)  → búsqueda por DNI (la principal)
GET    /api/v1/clientes/:id             (ambos)
POST   /api/v1/clientes                 (ambos)  → registrar cliente
PUT    /api/v1/clientes/:id             (ambos)
GET    /api/v1/clientes/:id/historial   (ambos)  → historial de compras
GET    /api/v1/clientes/:id/beneficios  (ambos)  → beneficios disponibles / contador
```

### Menú — productos y categorías (lectura ambos, escritura solo admin)
```
GET    /api/v1/menu                (ambos)  → menú completo agrupado
GET    /api/v1/productos           (ambos)
POST   /api/v1/productos           (admin)
PUT    /api/v1/productos/:id       (admin)
DELETE /api/v1/productos/:id       (admin)  → baja lógica (activo=false)
GET    /api/v1/categorias          (ambos)
POST   /api/v1/categorias          (admin)
PUT    /api/v1/categorias/:id      (admin)
```

### Beneficios y condiciones (lectura ambos, escritura solo admin)
```
GET    /api/v1/beneficios                    (ambos)
POST   /api/v1/beneficios                    (admin)
PUT    /api/v1/beneficios/:id                (admin)
DELETE /api/v1/beneficios/:id                (admin)
POST   /api/v1/beneficios/:id/condiciones    (admin)  → agregar condición
PUT    /api/v1/condiciones/:id               (admin)
```

### Instituciones
```
GET    /api/v1/instituciones       (ambos)
POST   /api/v1/instituciones       (admin)
PUT    /api/v1/instituciones/:id   (admin)
```

### Compras y canjes (núcleo operativo)
```
POST   /api/v1/compras             (ambos)  → registra venta, calcula total
GET    /api/v1/compras             (ambos)  → listado / filtros (historial general)
GET    /api/v1/compras/:id         (ambos)
POST   /api/v1/canjes              (ambos)  → aplica un beneficio disponible
GET    /api/v1/canjes              (ambos)
```

### Usuarios del sistema (gestión solo admin)
```
GET    /api/v1/usuarios                  (admin)
POST   /api/v1/usuarios                  (admin)  → crear operador/admin
PUT    /api/v1/usuarios/:id              (admin)
PUT    /api/v1/usuarios/:id/password     (admin)  → resetear contraseña de cualquiera
```

---

## 9. Roles y permisos

Dos roles con división estricta: el admin tiene control total; el operador solo opera la caja.

| Recurso / Acción | Operador | Administrador |
|------------------|:--------:|:-------------:|
| Login | Sí | Sí |
| Buscar cliente por DNI | Sí | Sí |
| Ver historial de cliente | Sí | Sí |
| Crear / editar cliente | Sí | Sí |
| Registrar compra | Sí | Sí |
| Aplicar canje de beneficio | Sí | Sí |
| Ver menú | Sí | Sí |
| Anular / editar compras | No | Sí |
| Crear / editar / borrar productos | No | Sí |
| Crear / editar categorías | No | Sí |
| Crear / editar beneficios | No | Sí |
| Crear / editar condiciones | No | Sí |
| Crear / editar instituciones | No | Sí |
| Gestionar usuarios del sistema | No | Sí |
| Cambiar contraseñas (incluida la propia) | No | Sí |
| Ver reportes / estadísticas | No | Sí |

El operador queda reducido a lo que define su trabajo: buscar clientes, registrar ventas y aplicar beneficios. Todo lo demás —configuración, historial editable, gestión de cuentas, contraseñas— es exclusivo del admin. El admin gestiona las contraseñas de todos, incluidos los operadores. No existe endpoint de "ver perfil propio" ni de cambio de contraseña por parte del operador.

### Implementación del RBAC

Como la división es limpia (operador = conjunto fijo y chico de acciones; admin = todo), no hace falta validar ownership ni un sistema de permisos granulares. El chequeo es puramente por rol con `RequireRole("administrador")`.

```go
protegidas := v1.Group("")
protegidas.Use(middleware.Auth())

// Operación diaria — ambos roles
protegidas.GET("/clientes/dni/:dni", clienteHandler.BuscarPorDNI)
protegidas.POST("/compras", compraHandler.Registrar)
protegidas.POST("/canjes", canjeHandler.Aplicar)
protegidas.GET("/menu", menuHandler.Listar)

// Configuración y gestión — solo admin
admin := protegidas.Group("")
admin.Use(middleware.RequireRole("administrador"))
admin.POST("/productos", menuHandler.CrearProducto)
admin.PUT("/productos/:id", menuHandler.EditarProducto)
admin.DELETE("/productos/:id", menuHandler.BorrarProducto)
admin.POST("/beneficios", beneficioHandler.Crear)
admin.POST("/instituciones", institucionHandler.Crear)
admin.POST("/usuarios", usuarioHandler.Crear)
admin.PUT("/usuarios/:id/password", usuarioHandler.ResetPassword)
```

Una sola línea divide los dos mundos: todo lo que está dentro del subgrupo con `RequireRole("administrador")` es territorio admin; todo lo de afuera (pero con `Auth`) lo comparten ambos.

---

## 10. Modelo de datos (base de datos)

### Entidades

**USUARIOS_SISTEMA** — Los operadores del sistema (no los clientes de la cafetería). El campo `rol` distingue administrador de operador. El control de permisos se valida en el backend según este campo. Guarda `password_hash` para login con JWT.

**INSTITUCIONES** — Los convenios. Una institución agrupa clientes y ofrece beneficios.

**CLIENTES** — Los clientes de la cafetería, identificados por DNI (único, clave de búsqueda en el dashboard). Mantienen `contador_infusiones` denormalizado para lectura rápida.

**CATEGORIAS** — Hace el menú editable y estructurado. `seccion` agrupa en las dos grandes (Cafetería / Cocina de mediodía), `nombre` es la subcategoría (Espresso & café, Filtrados, Ensaladas…), y `orden` permite reordenar la visualización.

**PRODUCTOS** — Cada ítem del menú. `activo` permite baja lógica sin borrar (preserva historial). `es_infusion` marca qué cuenta para los beneficios. El precio vive aquí y es editable.

**COMPRAS** — Cabecera del historial de compras. Guarda subtotal, descuento y total ya calculados, más quién la registró (`usuario_id`) y para qué cliente.

**DETALLE_COMPRA** — Las líneas de cada compra. Guarda `precio_unitario` al momento de la venta: si después cambia el precio de un producto, las compras históricas conservan el precio real cobrado.

**BENEFICIOS** — Los beneficios que ofrece cada institución. `activo` permite habilitarlos/deshabilitarlos.

**CONDICIONES** — Las reglas, separadas del beneficio para que sean dinámicas. Un beneficio puede tener varias condiciones (escalonadas: 5 infusiones → 10%, 10 → 25%). El campo `vigente` permite versionar: se desactiva una condición vieja y se crea una nueva sin perder el historial.

**CANJES** — Historial de beneficios otorgados. Apunta a `condicion_id` (qué regla exacta se cumplió) y a `compra_id` (en qué venta se aplicó), preservando trazabilidad completa aunque luego cambien beneficios o condiciones.

### Cardinalidades

| Relación | Cardinalidad | Lectura |
|----------|-------------|---------|
| INSTITUCIONES → CLIENTES | 1 : N (0..N) | Una institución agrupa varios clientes; un cliente pertenece a una institución |
| INSTITUCIONES → BENEFICIOS | 1 : N (0..N) | Una institución ofrece varios beneficios |
| BENEFICIOS → CONDICIONES | 1 : N (0..N) | Un beneficio tiene una o varias condiciones |
| CATEGORIAS → PRODUCTOS | 1 : N (0..N) | Una categoría clasifica varios productos |
| CLIENTES → COMPRAS | 1 : N (0..N) | Un cliente realiza varias compras |
| COMPRAS → DETALLE_COMPRA | 1 : N (1..N) | Una compra contiene al menos una línea |
| PRODUCTOS → DETALLE_COMPRA | 1 : N (0..N) | Un producto aparece en muchas líneas de compra |
| CLIENTES → CANJES | 1 : N (0..N) | Un cliente obtiene varios beneficios en el tiempo |
| BENEFICIOS → CANJES | 1 : N (0..N) | Un beneficio se aplica en muchos canjes |
| CONDICIONES → CANJES | 1 : N (0..N) | Una condición específica se cumple en varios canjes |
| COMPRAS → CANJES | 1 : 0..1 | Una compra puede generar (o no) un canje |
| USUARIOS_SISTEMA → COMPRAS | 1 : N (0..N) | Un usuario registra muchas compras |
| USUARIOS_SISTEMA → CANJES | 1 : N (0..N) | Un usuario procesa muchos canjes |

Notación: `||` = uno y solo uno (obligatorio), `o{` = cero o muchos, `|{` = uno o muchos (la compra obliga al menos un detalle).

### Atributos por tabla

```
USUARIOS_SISTEMA
  id              uuid    PK
  email           string  UK
  password_hash   string
  rol             string  (administrador | operador)
  activo          bool

INSTITUCIONES
  id              uuid    PK
  nombre          string
  activa          bool
  created_at      timestamp

CLIENTES
  id                    uuid    PK
  dni                   string  UK
  nombre                string
  email                 string
  institucion_id        uuid    FK → INSTITUCIONES
  contador_infusiones   int
  created_at            timestamp

CATEGORIAS
  id              uuid    PK
  nombre          string
  seccion         string  (Cafetería | Cocina de mediodía)
  orden           int

PRODUCTOS
  id              uuid    PK
  categoria_id    uuid    FK → CATEGORIAS
  nombre          string
  precio          int
  es_infusion     bool
  activo          bool

COMPRAS
  id              uuid    PK
  cliente_id      uuid    FK → CLIENTES
  usuario_id      uuid    FK → USUARIOS_SISTEMA
  subtotal        int
  descuento       int
  total           int
  fecha           timestamp

DETALLE_COMPRA
  id              uuid    PK
  compra_id       uuid    FK → COMPRAS
  producto_id     uuid    FK → PRODUCTOS
  cantidad        int
  precio_unitario int

BENEFICIOS
  id              uuid    PK
  institucion_id  uuid    FK → INSTITUCIONES
  nombre          string
  activo          bool

CONDICIONES
  id                  uuid    PK
  beneficio_id        uuid    FK → BENEFICIOS
  umbral_infusiones   int
  tipo_descuento      string  (porcentaje | monto_fijo)
  valor_descuento     int
  reinicia_contador   bool
  vigente             bool

CANJES
  id                  uuid    PK
  cliente_id          uuid    FK → CLIENTES
  beneficio_id        uuid    FK → BENEFICIOS
  condicion_id        uuid    FK → CONDICIONES
  compra_id           uuid    FK → COMPRAS
  usuario_id          uuid    FK → USUARIOS_SISTEMA
  descuento_aplicado  int
  fecha               timestamp
```

### Decisiones de diseño aplicadas

- **Contador denormalizado**: `contador_infusiones` se mantiene en CLIENTES para lectura rápida, y puede recalcularse desde el historial de compras/detalles si hace falta auditar.
- **Versionado de precios**: `precio_unitario` se guarda en DETALLE_COMPRA, preservando el precio real cobrado aunque el producto cambie de precio luego.
- **Versionado de condiciones**: el canje apunta a `condicion_id` y el campo `vigente` permite desactivar reglas viejas sin perder trazabilidad.
- **Baja lógica**: productos y otras entidades usan flags `activo`/`vigente` en vez de borrado físico, para no romper el historial.

---

## 11. Lógica de negocio (cliente → beneficio)

1. El cliente se registra con su DNI. Pertenece (o no) a una institución.
2. Cada vez que consume una infusión, se registra el consumo (vía la compra y su detalle) y se incrementa `contador_infusiones`.
3. La institución tiene beneficios con condiciones (ej. "5 infusiones → 20% de descuento").
4. Cuando el contador alcanza el umbral de la condición, el beneficio queda disponible.
5. Al canjearlo, se registra el canje con el descuento aplicado. Si la condición indica `reinicia_contador`, el contador vuelve a cero; si no, sigue acumulando.

Resumen del recorrido:

> Cliente (DNI) → pertenece a Institución → consume Productos (las infusiones suman al contador) → cuando alcanza el umbral de la Condición → el Beneficio queda disponible → se registra el Canje con el descuento → opcionalmente se reinicia el contador.

---

## 12. Categorías del menú

### CAFETERÍA
- Espresso & café
- Filtrados
- Té en hebras
- Fríos
- Infusiones
- Panadería

### COCINA DE MEDIODÍA
- Entre panes
- O casi...
- Untables y entradas
- Sopa de estación
- Tallarines que piden pan
- Sandwiches en focaccia
- Ensaladas
- Postres
- Bebidas sin alcohol

---

## 13. Pendientes

- **Esquema SQL real**: escribir los CREATE TABLE con tipos, claves foráneas y constraints, listos para golang-migrate y sqlc.
- **Beneficios globales vs. solo por institución**: actualmente todo beneficio cuelga de una institución (`institucion_id` obligatorio). Si se quieren beneficios generales para clientes sin convenio, `institucion_id` en BENEFICIOS debería permitir NULL.
- **Contenido de los SKILL.md**: redactar las convenciones detalladas y ejemplos de cada skill.
- **Auditoría avanzada** (opcional): registrar quién cambió cada precio o condición y cuándo, vía una tabla de auditoría. No necesario para el alcance actual.
