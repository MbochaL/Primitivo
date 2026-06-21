-- Categorías del menú. seccion agrupa en las dos grandes; orden permite reordenar la vista.
CREATE TABLE categorias (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre  TEXT    NOT NULL,
    seccion TEXT    NOT NULL CHECK (seccion IN ('Cafetería', 'Cocina de mediodía')),
    orden   INTEGER NOT NULL DEFAULT 0
);
