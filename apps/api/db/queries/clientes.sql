-- name: CreateCliente :one
INSERT INTO clientes (dni, nombre, email, institucion_id)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetClientePorID :one
SELECT c.*, i.nombre AS institucion_nombre
FROM clientes c
LEFT JOIN instituciones i ON i.id = c.institucion_id
WHERE c.id = $1;

-- name: GetClientePorDNI :one
SELECT c.*, i.nombre AS institucion_nombre
FROM clientes c
LEFT JOIN instituciones i ON i.id = c.institucion_id
WHERE c.dni = $1;

-- name: ListClientes :many
SELECT c.*, i.nombre AS institucion_nombre
FROM clientes c
LEFT JOIN instituciones i ON i.id = c.institucion_id
ORDER BY c.created_at DESC;

-- name: UpdateCliente :one
UPDATE clientes
SET nombre = $2,
    email = $3,
    institucion_id = $4
WHERE id = $1
RETURNING *;

-- name: IncrementarContadorInfusiones :exec
UPDATE clientes
SET contador_infusiones = contador_infusiones + $2
WHERE id = $1;

-- name: ReiniciarContadorInfusiones :exec
UPDATE clientes
SET contador_infusiones = 0
WHERE id = $1;

-- name: DeleteCliente :exec
DELETE FROM clientes WHERE id = $1;

-- name: BuscarClientes :many
SELECT c.id, c.dni, c.nombre, c.email, c.institucion_id, c.contador_infusiones, c.created_at,
       i.nombre AS institucion_nombre
FROM clientes c
LEFT JOIN instituciones i ON i.id = c.institucion_id
WHERE c.dni = $1 OR c.nombre ILIKE '%' || $1 || '%'
ORDER BY
    CASE WHEN c.dni = $1 THEN 0 ELSE 1 END,
    c.nombre
LIMIT 10;
