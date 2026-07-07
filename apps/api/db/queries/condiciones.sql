-- name: ListCondicionesPorInstitucion :many
SELECT
    c.id AS condicion_id,
    c.umbral_infusiones,
    c.tipo_descuento,
    c.valor_descuento,
    c.reinicia_contador,
    c.tipo_trigger,
    c.dias_semana,
    c.scope_trigger,
    c.scope_trigger_categoria_id,
    c.scope_trigger_producto_id,
    c.scope_descuento,
    c.scope_descuento_categoria_id,
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
    c.tipo_trigger,
    c.dias_semana,
    c.scope_trigger,
    c.scope_trigger_categoria_id,
    c.scope_trigger_producto_id,
    c.scope_descuento,
    c.scope_descuento_categoria_id,
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
INSERT INTO condiciones (
    beneficio_id, umbral_infusiones, tipo_descuento, valor_descuento, reinicia_contador, vigente,
    tipo_trigger, dias_semana, scope_trigger, scope_trigger_categoria_id, scope_trigger_producto_id,
    scope_descuento, scope_descuento_categoria_id
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
RETURNING *;

-- name: UpdateCondicion :one
UPDATE condiciones
SET umbral_infusiones            = $2,
    tipo_descuento               = $3,
    valor_descuento              = $4,
    reinicia_contador            = $5,
    vigente                      = $6,
    tipo_trigger                 = $7,
    dias_semana                  = $8,
    scope_trigger                = $9,
    scope_trigger_categoria_id   = $10,
    scope_trigger_producto_id    = $11,
    scope_descuento              = $12,
    scope_descuento_categoria_id = $13
WHERE id = $1
RETURNING *;
