-- Permite hard-delete de clientes eliminando en cascada sus compras y canjes.
ALTER TABLE compras DROP CONSTRAINT IF EXISTS compras_cliente_id_fkey;
ALTER TABLE compras ADD CONSTRAINT compras_cliente_id_fkey
    FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE CASCADE;

ALTER TABLE canjes DROP CONSTRAINT IF EXISTS canjes_cliente_id_fkey;
ALTER TABLE canjes ADD CONSTRAINT canjes_cliente_id_fkey
    FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE CASCADE;
