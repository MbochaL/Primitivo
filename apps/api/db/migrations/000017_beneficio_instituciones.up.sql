-- Un beneficio puede pertenecer a varias instituciones (M:N).
-- 1. Crear la tabla de unión.
-- 2. Migrar datos existentes de beneficios.institucion_id.
-- 3. Quitar la columna del lado N-1 original.
CREATE TABLE beneficio_instituciones (
    beneficio_id   UUID NOT NULL REFERENCES beneficios(id) ON DELETE CASCADE,
    institucion_id UUID NOT NULL REFERENCES instituciones(id) ON DELETE CASCADE,
    PRIMARY KEY (beneficio_id, institucion_id)
);

CREATE INDEX idx_bi_beneficio   ON beneficio_instituciones (beneficio_id);
CREATE INDEX idx_bi_institucion ON beneficio_instituciones (institucion_id);

INSERT INTO beneficio_instituciones (beneficio_id, institucion_id)
SELECT id, institucion_id FROM beneficios;

ALTER TABLE beneficios DROP COLUMN institucion_id;
