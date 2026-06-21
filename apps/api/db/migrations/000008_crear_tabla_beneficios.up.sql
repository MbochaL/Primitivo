-- Beneficios que ofrece cada institución. activo permite habilitarlos/deshabilitarlos.
CREATE TABLE beneficios (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID    NOT NULL REFERENCES instituciones (id) ON DELETE RESTRICT,
    nombre         TEXT    NOT NULL,
    activo         BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_beneficios_institucion_id ON beneficios (institucion_id);
