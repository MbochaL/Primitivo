-- name: ListCategorias :many
SELECT * FROM categorias
ORDER BY seccion, orden, nombre;

-- name: CreateCategoria :one
INSERT INTO categorias (nombre, seccion, orden)
VALUES ($1, $2, $3)
RETURNING *;
