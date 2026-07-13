-- Relaja todas las FK ON DELETE RESTRICT excepto las que apuntan a clientes.
-- Permite eliminar compras, beneficios, condiciones, usuarios y productos sin bloquear
-- por registros dependientes en otras tablas. Los datos de clientes siguen siendo RESTRICT.

-- canjes: cascade desde beneficios, condiciones, compras y usuarios_sistema
ALTER TABLE canjes DROP CONSTRAINT canjes_beneficio_id_fkey;
ALTER TABLE canjes ADD CONSTRAINT canjes_beneficio_id_fkey
    FOREIGN KEY (beneficio_id) REFERENCES beneficios (id) ON DELETE CASCADE;

ALTER TABLE canjes DROP CONSTRAINT canjes_condicion_id_fkey;
ALTER TABLE canjes ADD CONSTRAINT canjes_condicion_id_fkey
    FOREIGN KEY (condicion_id) REFERENCES condiciones (id) ON DELETE CASCADE;

ALTER TABLE canjes DROP CONSTRAINT canjes_compra_id_fkey;
ALTER TABLE canjes ADD CONSTRAINT canjes_compra_id_fkey
    FOREIGN KEY (compra_id) REFERENCES compras (id) ON DELETE CASCADE;

ALTER TABLE canjes DROP CONSTRAINT canjes_usuario_id_fkey;
ALTER TABLE canjes ADD CONSTRAINT canjes_usuario_id_fkey
    FOREIGN KEY (usuario_id) REFERENCES usuarios_sistema (id) ON DELETE CASCADE;

-- compras: cascade desde usuarios_sistema
ALTER TABLE compras DROP CONSTRAINT compras_usuario_id_fkey;
ALTER TABLE compras ADD CONSTRAINT compras_usuario_id_fkey
    FOREIGN KEY (usuario_id) REFERENCES usuarios_sistema (id) ON DELETE CASCADE;

-- detalle_compra: cascade desde productos
ALTER TABLE detalle_compra DROP CONSTRAINT detalle_compra_producto_id_fkey;
ALTER TABLE detalle_compra ADD CONSTRAINT detalle_compra_producto_id_fkey
    FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE CASCADE;
