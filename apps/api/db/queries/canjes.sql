-- name: CreateCanje :one
INSERT INTO canjes (cliente_id, beneficio_id, condicion_id, compra_id, usuario_id, descuento_aplicado)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetFechaUltimoCanjeCondicion :one
SELECT fecha FROM canjes
WHERE cliente_id = $1 AND condicion_id = $2
ORDER BY fecha DESC
LIMIT 1;
