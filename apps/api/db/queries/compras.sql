-- name: ListComprasPorCliente :many
SELECT * FROM compras
WHERE cliente_id = $1
ORDER BY fecha DESC;

-- name: ListComprasEnRango :many
SELECT
    c.id, c.cliente_id, c.usuario_id, c.subtotal, c.descuento, c.total, c.fecha,
    cl.nombre AS cliente_nombre,
    cl.dni    AS cliente_dni
FROM compras c
JOIN clientes cl ON cl.id = c.cliente_id
WHERE c.fecha >= $1 AND c.fecha < $2
ORDER BY c.fecha DESC;

-- name: CreateCompra :one
INSERT INTO compras (cliente_id, usuario_id, subtotal, descuento, total)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: CreateDetalleCompra :exec
INSERT INTO detalle_compra (compra_id, producto_id, cantidad, precio_unitario)
VALUES ($1, $2, $3, $4);

-- name: ContarItemsPorClienteYCategoria :one
SELECT COALESCE(SUM(dc.cantidad), 0)::INTEGER AS total
FROM detalle_compra dc
JOIN compras co ON co.id = dc.compra_id
JOIN productos p ON p.id = dc.producto_id
WHERE co.cliente_id = $1
  AND p.categoria_id = $2
  AND ($3::timestamptz IS NULL OR co.fecha > $3);

-- name: DeleteCompra :exec
DELETE FROM compras WHERE id = $1;

-- name: ContarItemsPorClienteYProducto :one
SELECT COALESCE(SUM(dc.cantidad), 0)::INTEGER AS total
FROM detalle_compra dc
JOIN compras co ON co.id = dc.compra_id
WHERE co.cliente_id = $1
  AND dc.producto_id = $2
  AND ($3::timestamptz IS NULL OR co.fecha > $3);
