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
