-- Condiciones (reglas) de un beneficio, separadas para que sean dinámicas y escalonadas
-- (5 infusiones -> 10%, 10 -> 25%). vigente permite versionar sin perder historial.
CREATE TABLE condiciones (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficio_id      UUID    NOT NULL REFERENCES beneficios (id) ON DELETE CASCADE,
    umbral_infusiones INTEGER NOT NULL CHECK (umbral_infusiones >= 0),
    tipo_descuento    TEXT    NOT NULL CHECK (tipo_descuento IN ('porcentaje', 'monto_fijo')),
    valor_descuento   INTEGER NOT NULL CHECK (valor_descuento >= 0),
    reinicia_contador BOOLEAN NOT NULL DEFAULT FALSE,
    vigente           BOOLEAN NOT NULL DEFAULT TRUE,
    -- Un porcentaje no puede superar el 100%.
    CONSTRAINT chk_condiciones_porcentaje_max
        CHECK (tipo_descuento <> 'porcentaje' OR valor_descuento <= 100)
);

CREATE INDEX idx_condiciones_beneficio_id ON condiciones (beneficio_id);
