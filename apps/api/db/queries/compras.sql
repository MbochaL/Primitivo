-- name: ListComprasPorCliente :many
SELECT * FROM compras
WHERE cliente_id = $1
ORDER BY fecha DESC;
