-- name: ListProductosActivos :many
SELECT * FROM productos
WHERE activo = true
ORDER BY nombre;

-- name: ListAllProductos :many
SELECT * FROM productos
ORDER BY nombre;

-- name: GetProductoPorID :one
SELECT * FROM productos
WHERE id = $1;

-- name: CreateProducto :one
INSERT INTO productos (categoria_id, nombre, descripcion, precio, es_infusion)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: UpdateProducto :one
UPDATE productos
SET categoria_id = $2, nombre = $3, descripcion = $4, precio = $5, es_infusion = $6, activo = $7
WHERE id = $1
RETURNING *;

-- name: ToggleProductoActivo :one
UPDATE productos SET activo = $2 WHERE id = $1 RETURNING *;
