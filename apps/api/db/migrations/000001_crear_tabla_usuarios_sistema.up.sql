-- Usuarios del sistema (operadores y administradores). No son los clientes de la cafetería.
CREATE TABLE usuarios_sistema (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    rol           TEXT    NOT NULL CHECK (rol IN ('administrador', 'operador')),
    activo        BOOLEAN NOT NULL DEFAULT TRUE
);
