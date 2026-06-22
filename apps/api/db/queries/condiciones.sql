-- name: ListCondicionesPorInstitucion :many
SELECT
    c.id AS condicion_id,
    c.umbral_infusiones,
    c.tipo_descuento,
    c.valor_descuento,
    c.reinicia_contador,
    b.nombre AS beneficio_nombre
FROM condiciones c
JOIN beneficios b ON b.id = c.beneficio_id
WHERE b.institucion_id = $1
  AND c.vigente = true
  AND b.activo = true
ORDER BY c.umbral_infusiones ASC;

-- name: GetCondicionParaCanje :one
SELECT
    c.id,
    c.beneficio_id,
    c.umbral_infusiones,
    c.tipo_descuento,
    c.valor_descuento,
    c.reinicia_contador,
    c.vigente,
    b.institucion_id,
    b.activo AS beneficio_activo
FROM condiciones c
JOIN beneficios b ON b.id = c.beneficio_id
WHERE c.id = $1;

-- name: ListTodasCondiciones :many
SELECT * FROM condiciones
ORDER BY beneficio_id, umbral_infusiones ASC;

-- name: ListCondicionesPorBeneficio :many
SELECT * FROM condiciones
WHERE beneficio_id = $1
ORDER BY umbral_infusiones ASC;

-- name: CreateCondicion :one
INSERT INTO condiciones (beneficio_id, umbral_infusiones, tipo_descuento, valor_descuento, reinicia_contador, vigente)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: UpdateCondicion :one
UPDATE condiciones
SET umbral_infusiones = $2,
    tipo_descuento    = $3,
    valor_descuento   = $4,
    reinicia_contador = $5,
    vigente           = $6
WHERE id = $1
RETURNING *;
