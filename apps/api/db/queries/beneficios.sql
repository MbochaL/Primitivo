-- name: ListBeneficios :many
SELECT b.id, b.institucion_id, b.nombre, b.activo, i.nombre AS institucion_nombre
FROM beneficios b
LEFT JOIN instituciones i ON i.id = b.institucion_id
ORDER BY i.nombre ASC NULLS LAST, b.nombre ASC;

-- name: GetBeneficioPorID :one
SELECT b.id, b.institucion_id, b.nombre, b.activo, i.nombre AS institucion_nombre
FROM beneficios b
LEFT JOIN instituciones i ON i.id = b.institucion_id
WHERE b.id = $1;

-- name: CreateBeneficio :one
INSERT INTO beneficios (institucion_id, nombre)
VALUES ($1, $2)
RETURNING *;

-- name: UpdateBeneficio :one
UPDATE beneficios
SET nombre = $2, activo = $3, institucion_id = $4
WHERE id = $1
RETURNING *;

-- name: ToggleBeneficioActivo :one
UPDATE beneficios SET activo = $2 WHERE id = $1 RETURNING *;

-- name: CountCanjesPorBeneficio :one
SELECT COUNT(*) FROM canjes WHERE beneficio_id = $1;

-- name: DeleteBeneficio :exec
DELETE FROM beneficios WHERE id = $1;
