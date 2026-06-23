---
name: primitivo-go-migrations
description: Convenciones para migraciones de base de datos en Primitivo usando golang-migrate sobre PostgreSQL. Úsala SIEMPRE que se cree, edite o aplique una migración, cuando se modifique el esquema de la base (tablas, columnas, índices, constraints), o cuando se necesite revertir un cambio de esquema. Si vas a tocar la estructura de la base de datos de Primitivo, consultá esta skill primero para mantener migraciones reversibles y bien nombradas.
---

# Migraciones con golang-migrate — Primitivo

El esquema de PostgreSQL se versiona con **golang-migrate**. Esta skill define cómo se escriben las migraciones para que el esquema sea reproducible y reversible entre los dos integrantes del equipo.

## Dónde viven

Todas las migraciones en `apps/api/db/migrations/`. Cada cambio son **dos archivos**: uno `up` (aplica) y uno `down` (revierte).

## Naming

golang-migrate usa el formato `{version}_{descripcion}.{up|down}.sql`:

```
000001_crear_tabla_clientes.up.sql
000001_crear_tabla_clientes.down.sql
000002_crear_tabla_beneficios.up.sql
000002_crear_tabla_beneficios.down.sql
000003_agregar_indice_dni_clientes.up.sql
000003_agregar_indice_dni_clientes.down.sql
```

- Versión con padding de ceros (`000001`), secuencial.
- Descripción en `snake_case`, verbo claro: `crear_tabla_x`, `agregar_columna_y`, `crear_indice_z`.
- Generalas con el CLI para no equivocarte el número: `migrate create -ext sql -dir db/migrations -seq descripcion`.

## Regla de oro: toda `up` tiene su `down`

ALWAYS escribí el `down` que revierte exactamente lo que hace el `up`. Si el `up` crea una tabla, el `down` la dropea. Si el `up` agrega una columna, el `down` la quita. Una migración sin down reversible rompe la capacidad del equipo de retroceder.

**Ejemplo:**

`up`:
```sql
CREATE TABLE clientes (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dni                  TEXT UNIQUE NOT NULL,
    nombre               TEXT NOT NULL,
    email                TEXT,
    institucion_id       UUID REFERENCES instituciones(id),
    contador_infusiones  INTEGER NOT NULL DEFAULT 0,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`down`:
```sql
DROP TABLE clientes;
```

> `gen_random_uuid()` es nativo en PostgreSQL 13+. En versiones previas, habilitá la extensión `pgcrypto` (`CREATE EXTENSION IF NOT EXISTS pgcrypto;`) en la primera migración.

## Buenas prácticas

- **Migraciones pequeñas y atómicas.** Un cambio conceptual por migración (una tabla, un índice). No mezcles cinco cambios no relacionados en un archivo — complica el rollback.
- **Inmutables una vez aplicadas y compartidas.** Si una migración ya está en el repo y tu compañero la corrió, NO la edites. Creá una nueva. Editar una migración ya aplicada desincroniza las bases de cada uno.
- **Nombres de tablas/columnas en `snake_case`**, consistente con lo que espera sqlc (ver skill `primitivo-sqlc-queries`).
- **IDs en `UUID`** con `DEFAULT gen_random_uuid()` (nunca `BIGSERIAL`). Las claves foráneas también son `UUID`. Usá `TIMESTAMPTZ` para fechas y constraints explícitos (`NOT NULL`, `UNIQUE`, `FOREIGN KEY`).
- Para índices en tablas grandes considerá `CREATE INDEX CONCURRENTLY` (pero ojo: no corre dentro de transacción).

## Flujo de trabajo en equipo

1. Generás el par up/down con `migrate create`.
2. Escribís el SQL de ambos.
3. Aplicás local con `migrate up` y verificás que `migrate down` revierte limpio.
4. Commiteás ambos archivos juntos.
5. Tu compañero, al pullear, corre `migrate up` para quedar sincronizado.
