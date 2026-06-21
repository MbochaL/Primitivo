-- Seed de menú de ejemplo (idempotente: solo inserta si las tablas están vacías).
-- Uso: psql "$DATABASE_URL" -f db/seeds/menu_demo.sql   (con PGCLIENTENCODING=UTF8)
SET client_encoding TO 'UTF8';

INSERT INTO categorias (nombre, seccion, orden)
SELECT * FROM (VALUES
  ('Espresso & café', 'Cafetería', 1),
  ('Infusiones', 'Cafetería', 2),
  ('Panadería', 'Cafetería', 3),
  ('Entre panes', 'Cocina de mediodía', 1)
) AS v(nombre, seccion, orden)
WHERE NOT EXISTS (SELECT 1 FROM categorias);

INSERT INTO productos (categoria_id, nombre, precio, es_infusion)
SELECT c.id, p.nombre, p.precio, p.es_infusion
FROM (VALUES
  ('Espresso & café', 'Espresso', 1500, true),
  ('Espresso & café', 'Cortado', 1700, true),
  ('Espresso & café', 'Latte', 2200, true),
  ('Infusiones', 'Té en hebras', 1600, true),
  ('Infusiones', 'Mate cocido', 1200, true),
  ('Panadería', 'Medialuna', 900, false),
  ('Panadería', 'Tostado', 3200, false),
  ('Entre panes', 'Focaccia', 4800, false)
) AS p(cat, nombre, precio, es_infusion)
JOIN categorias c ON c.nombre = p.cat
WHERE NOT EXISTS (SELECT 1 FROM productos);
