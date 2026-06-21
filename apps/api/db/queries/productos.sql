-- name: ListProductosActivos :many
SELECT * FROM productos
WHERE activo = true
ORDER BY nombre;

-- name: GetProductoPorID :one
SELECT * FROM productos
WHERE id = $1;

-- name: CreateProducto :one
INSERT INTO productos (categoria_id, nombre, precio, es_infusion)
VALUES ($1, $2, $3, $4)
RETURNING *;
