-- Clientes de la cafetería, identificados por DNI (único, clave de búsqueda del dashboard).
-- contador_infusiones se mantiene denormalizado para lectura rápida y evaluación de beneficios.
CREATE TABLE clientes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dni                 TEXT        NOT NULL UNIQUE,
    nombre              TEXT        NOT NULL,
    email               TEXT,
    institucion_id      UUID        REFERENCES instituciones (id) ON DELETE RESTRICT,
    contador_infusiones INTEGER     NOT NULL DEFAULT 0 CHECK (contador_infusiones >= 0),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para los lookups por institución (el de dni ya lo crea la constraint UNIQUE).
CREATE INDEX idx_clientes_institucion_id ON clientes (institucion_id);
