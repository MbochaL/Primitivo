-- Cabecera del historial de compras. Guarda subtotal, descuento y total ya calculados,
-- más quién la registró (usuario_id) y para qué cliente. Montos en centavos.
CREATE TABLE compras (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID        NOT NULL REFERENCES clientes (id) ON DELETE RESTRICT,
    usuario_id UUID        NOT NULL REFERENCES usuarios_sistema (id) ON DELETE RESTRICT,
    subtotal   INTEGER     NOT NULL CHECK (subtotal >= 0),
    descuento  INTEGER     NOT NULL DEFAULT 0 CHECK (descuento >= 0),
    total      INTEGER     NOT NULL CHECK (total >= 0),
    fecha      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_compras_cliente_id ON compras (cliente_id);
CREATE INDEX idx_compras_usuario_id ON compras (usuario_id);
