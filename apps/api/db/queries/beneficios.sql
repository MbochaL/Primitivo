-- name: ListBeneficios :many
SELECT id, nombre, activo FROM beneficios ORDER BY nombre ASC;

-- name: GetBeneficioPorID :one
SELECT id, nombre, activo FROM beneficios WHERE id = $1;

-- name: ListTodasInstitucionesBeneficios :many
SELECT bi.beneficio_id, bi.institucion_id, i.nombre AS institucion_nombre
FROM beneficio_instituciones bi
JOIN instituciones i ON i.id = bi.institucion_id
ORDER BY bi.beneficio_id, i.nombre;

-- name: ListInstitucionesPorBeneficio :many
SELECT bi.beneficio_id, bi.institucion_id, i.nombre AS institucion_nombre
FROM beneficio_instituciones bi
JOIN instituciones i ON i.id = bi.institucion_id
WHERE bi.beneficio_id = $1
ORDER BY i.nombre;

-- name: InsertBeneficioInstitucion :exec
INSERT INTO beneficio_instituciones (beneficio_id, institucion_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING;

-- name: DeleteBeneficioInstituciones :exec
DELETE FROM beneficio_instituciones WHERE beneficio_id = $1;

-- name: CreateBeneficio :one
INSERT INTO beneficios (nombre)
VALUES ($1)
RETURNING id, nombre, activo;

-- name: UpdateBeneficio :one
UPDATE beneficios
SET nombre = $2, activo = $3
WHERE id = $1
RETURNING id, nombre, activo;

-- name: ToggleBeneficioActivo :one
UPDATE beneficios SET activo = $2 WHERE id = $1 RETURNING id, nombre, activo;

-- name: CountCanjesPorBeneficio :one
SELECT COUNT(*) FROM canjes WHERE beneficio_id = $1;

-- name: DeleteBeneficio :exec
DELETE FROM beneficios WHERE id = $1;
