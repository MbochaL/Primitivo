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
ORDER BY c.created_at DESC
LIMIT 50;

-- name: UpdateCliente :one
UPDATE clientes
SET nombre = $2,
    email = $3,
    institucion_id = $4
WHERE id = $1
RETURNING *;
