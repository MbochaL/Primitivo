-- name: ListCategorias :many
SELECT * FROM categorias
ORDER BY seccion, orden, nombre;

-- name: GetCategoriaPorID :one
SELECT * FROM categorias WHERE id = $1;

-- name: CreateCategoria :one
INSERT INTO categorias (nombre, seccion, orden)
VALUES ($1, $2, $3)
RETURNING *;

-- name: UpdateCategoria :one
UPDATE categorias
SET nombre = $2, seccion = $3, orden = $4
WHERE id = $1
RETURNING *;
