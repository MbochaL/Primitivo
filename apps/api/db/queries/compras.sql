-- name: ListComprasPorCliente :many
SELECT * FROM compras
WHERE cliente_id = $1
ORDER BY fecha DESC;

-- name: CreateCompra :one
INSERT INTO compras (cliente_id, usuario_id, subtotal, descuento, total)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: CreateDetalleCompra :exec
INSERT INTO detalle_compra (compra_id, producto_id, cantidad, precio_unitario)
VALUES ($1, $2, $3, $4);
