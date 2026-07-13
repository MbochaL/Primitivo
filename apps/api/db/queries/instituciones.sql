-- name: CreateInstitucion :one
INSERT INTO instituciones (nombre)
VALUES ($1)
RETURNING *;

-- name: GetInstitucionByID :one
SELECT * FROM instituciones
WHERE id = $1;

-- name: ListInstituciones :many
SELECT * FROM instituciones
ORDER BY nombre;

-- name: UpdateInstitucion :one
UPDATE instituciones
SET nombre = $2,
    activa = $3
WHERE id = $1
RETURNING *;

-- name: NullifyClientesInstitucion :exec
UPDATE clientes SET institucion_id = NULL WHERE institucion_id = $1;

-- name: NullifyBeneficiosInstitucion :exec
UPDATE beneficios SET institucion_id = NULL WHERE institucion_id = $1;

-- name: DeleteInstitucion :exec
DELETE FROM instituciones WHERE id = $1;
