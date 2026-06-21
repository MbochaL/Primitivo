-- Productos del menú. activo permite baja lógica (preserva historial); es_infusion marca
-- qué cuenta para los beneficios. El precio (en centavos) vive acá y es editable.
CREATE TABLE productos (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id UUID    NOT NULL REFERENCES categorias (id) ON DELETE RESTRICT,
    nombre       TEXT    NOT NULL,
    precio       INTEGER NOT NULL CHECK (precio >= 0),
    es_infusion  BOOLEAN NOT NULL DEFAULT FALSE,
    activo       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_productos_categoria_id ON productos (categoria_id);
