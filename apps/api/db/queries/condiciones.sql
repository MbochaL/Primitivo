-- name: ListCondicionesPorInstitucion :many
SELECT
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
