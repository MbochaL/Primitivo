-- Historial de beneficios otorgados. Apunta a condicion_id (qué regla exacta se cumplió)
-- y a compra_id (en qué venta se aplicó), preservando trazabilidad completa.
-- compra_id es UNIQUE: una compra genera a lo sumo un canje (cardinalidad 1:0..1).
CREATE TABLE canjes (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id         UUID        NOT NULL REFERENCES clientes (id) ON DELETE RESTRICT,
    beneficio_id       UUID        NOT NULL REFERENCES beneficios (id) ON DELETE RESTRICT,
    condicion_id       UUID        NOT NULL REFERENCES condiciones (id) ON DELETE RESTRICT,
    compra_id          UUID        NOT NULL UNIQUE REFERENCES compras (id) ON DELETE RESTRICT,
    usuario_id         UUID        NOT NULL REFERENCES usuarios_sistema (id) ON DELETE RESTRICT,
    descuento_aplicado INTEGER     NOT NULL CHECK (descuento_aplicado >= 0),
    fecha              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- compra_id ya tiene índice por la constraint UNIQUE.
CREATE INDEX idx_canjes_cliente_id ON canjes (cliente_id);
CREATE INDEX idx_canjes_beneficio_id ON canjes (beneficio_id);
CREATE INDEX idx_canjes_condicion_id ON canjes (condicion_id);
CREATE INDEX idx_canjes_usuario_id ON canjes (usuario_id);
