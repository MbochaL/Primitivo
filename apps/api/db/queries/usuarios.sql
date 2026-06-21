-- name: CreateUsuario :one
INSERT INTO usuarios_sistema (email, password_hash, rol)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetUsuarioByID :one
SELECT * FROM usuarios_sistema
WHERE id = $1;

-- name: GetUsuarioByEmail :one
SELECT * FROM usuarios_sistema
WHERE email = $1;

-- name: ListUsuarios :many
SELECT * FROM usuarios_sistema
ORDER BY email;

-- name: UpdateUsuario :one
UPDATE usuarios_sistema
SET email = $2,
    rol = $3,
    activo = $4
WHERE id = $1
RETURNING *;

-- name: UpdateUsuarioPassword :exec
UPDATE usuarios_sistema
SET password_hash = $2
WHERE id = $1;
