---
name: primitivo-sqlc-queries
description: Convenciones para escribir queries SQL y acceder a PostgreSQL en el backend de Primitivo usando sqlc + pgx. Úsala SIEMPRE que se cree o modifique un archivo .sql en db/queries, cuando se necesite una nueva operación de base de datos, cuando se genere o use código de sqlc, o cuando se trabaje con la capa repository. Si vas a tocar cualquier query o acceso a datos en Primitivo, consultá esta skill primero para mantener naming y tipos consistentes.
---

# Queries con sqlc + pgx — Primitivo

El backend usa **sqlc** para generar código Go type-safe a partir de SQL, sobre el driver **pgx**. Esta skill define cómo se escriben las queries para que el código generado sea consistente y predecible.

## Dónde vive cada cosa

- Las queries SQL escritas a mano: `apps/api/db/queries/*.sql`.
- El código generado por sqlc: `apps/api/internal/db/sqlc/` — **nunca se edita a mano**, se regenera con `sqlc generate`.
- El acceso desde la lógica pasa por `apps/api/internal/repository/`, que envuelve las funciones generadas. Los services hablan con el repository, no con sqlc directo.

## Formato de las queries

ALWAYS anotá cada query con el nombre y el tipo de retorno:

```sql
-- name: GetClientePorDNI :one
SELECT * FROM clientes WHERE dni = $1;

-- name: ListBeneficiosActivosPorInstitucion :many
SELECT * FROM beneficios
WHERE institucion_id = $1 AND activo = true
ORDER BY created_at DESC;

-- name: ListCondicionesVigentes :many
SELECT * FROM condiciones
WHERE beneficio_id = $1 AND vigente = true
ORDER BY umbral_infusiones ASC;

-- name: IncrementarContadorInfusiones :exec
UPDATE clientes
SET contador_infusiones = contador_infusiones + $2
WHERE id = $1;

-- name: ReiniciarContadorInfusiones :exec
UPDATE clientes
SET contador_infusiones = 0
WHERE id = $1;
```

Tipos de retorno: `:one` (una fila), `:many` (varias), `:exec` (sin retorno), `:execrows` (filas afectadas).

## Naming

- Nombres de query en **PascalCase**, con verbo claro al inicio: `Get`, `List`, `Crear`, `Actualizar`, `Borrar`, `Contar`, `Incrementar`.
- El nombre describe qué devuelve: `GetClientePorDNI`, `ListBeneficiosActivosPorInstitucion`, `IncrementarContadorInfusiones`.
- Tablas y columnas en `snake_case` minúscula.

## Tipos pgx

- IDs y claves foráneas son `UUID` → mapean a `pgtype.UUID` (o `uuid.UUID` de `github.com/google/uuid` si configurás el override en `sqlc.yaml`).
- Usá los tipos de `pgtype` para columnas que pueden ser NULL o que necesitan precisión: `pgtype.Timestamptz`, `pgtype.Numeric`, `pgtype.Text`. No uses `time.Time` o `string` directo para columnas nullable — vas a tener problemas con NULL.
- Configurá sqlc para emitir tipos pgx (en `sqlc.yaml`, engine postgresql con `sql_package: pgx/v5`).

## Buenas prácticas

- **Una query, una responsabilidad.** No metas lógica de negocio en SQL gigante; las reglas (ej. qué beneficio se habilita según el contador de infusiones) van en el `service`. La query trae o guarda datos.
- **Siempre parametrizadas** (`$1`, `$2`). Nunca concatenes valores en el string SQL — riesgo de inyección.
- **Transacciones en el repository.** Cuando una operación toca varias tablas (ej. registrar la compra + su detalle + el canje + actualizar `contador_infusiones`), agrupala en una transacción pgx dentro del repository, no en el handler. Esta es la operación crítica del sistema: o se persiste todo o se hace rollback de todo.
- Agrupá las queries por entidad en archivos separados: `clientes.sql`, `beneficios.sql`, `condiciones.sql`, `compras.sql`, `canjes.sql`.

## Flujo al agregar una query

1. Escribís la query en el `.sql` correspondiente con su anotación `-- name:`.
2. Corrés `sqlc generate`.
3. Envolvés la función generada en el repository si hace falta lógica extra (transacción, mapeo).
4. El service la consume.
