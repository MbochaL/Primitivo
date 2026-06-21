-- Líneas de cada compra. precio_unitario (en centavos) versiona el precio: conserva el
-- valor real cobrado aunque el producto cambie de precio después.
CREATE TABLE detalle_compra (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compra_id       UUID    NOT NULL REFERENCES compras (id) ON DELETE CASCADE,
    producto_id     UUID    NOT NULL REFERENCES productos (id) ON DELETE RESTRICT,
    cantidad        INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario INTEGER NOT NULL CHECK (precio_unitario >= 0)
);

CREATE INDEX idx_detalle_compra_compra_id ON detalle_compra (compra_id);
CREATE INDEX idx_detalle_compra_producto_id ON detalle_compra (producto_id);
