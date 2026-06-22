-- Seed del menú real de Primitivo (idempotente: solo inserta si no hay datos).
-- Uso: psql "$DATABASE_URL" -f db/seeds/menu_real.sql  (con PGCLIENTENCODING=UTF8 si aplica)
SET client_encoding TO 'UTF8';

-- ── Categorías ───────────────────────────────────────────────────────────────
INSERT INTO categorias (nombre, seccion, orden)
SELECT * FROM (VALUES
  ('Espresso & café',       'Cafetería',          1),
  ('Filtrados',             'Cafetería',          2),
  ('Té en hebras',          'Cafetería',          3),
  ('Fríos',                 'Cafetería',          4),
  ('Infusiones',            'Cafetería',          5),
  ('Panadería',             'Cafetería',          6),
  ('Entre panes',           'Cocina de mediodía', 1),
  ('O casi...',             'Cocina de mediodía', 2),
  ('Untables y entradas',   'Cocina de mediodía', 3),
  ('Sopa de estación',      'Cocina de mediodía', 4),
  ('Tallarines que piden pan', 'Cocina de mediodía', 5),
  ('Sandwiches en focaccia','Cocina de mediodía', 6),
  ('Ensaladas',             'Cocina de mediodía', 7),
  ('Postres',               'Cocina de mediodía', 8),
  ('Bebidas sin alcohol',   'Cocina de mediodía', 9)
) AS v(nombre, seccion, orden)
WHERE NOT EXISTS (SELECT 1 FROM categorias);

-- ── Productos ────────────────────────────────────────────────────────────────
INSERT INTO productos (categoria_id, nombre, descripcion, precio, es_infusion)
SELECT c.id, p.nombre, p.descripcion, p.precio, p.es_infusion
FROM (VALUES
  -- Espresso & café
  ('Espresso & café', 'Espresso',             'Café intenso de corta extracción aprox. 30ml. Taza de 90ml',                     3500,  true),
  ('Espresso & café', 'Doppio',               'Dosis doble de espresso aprox. 60ml. Taza de 90ml',                               4000,  true),
  ('Espresso & café', 'Americano',            'Espresso + 3/4 de agua, más suave. Taza de 180ml',                                4000,  true),
  ('Espresso & café', 'Short black',          'Espresso + 3/4 de agua. Taza de 90ml',                                            4000,  true),
  ('Espresso & café', 'Long black',           'Doble espresso vertido sobre 3/4 de agua. Taza de 180ml',                         4000,  true),
  ('Espresso & café', 'Capuccino',            'Espresso + leche vaporizada de textura cremosa. Taza de 180ml',                   4200,  true),
  ('Espresso & café', 'Mocaccino',            'Base de café + chocolate con leche vaporizada de textura cremosa. Taza de 220ml', 4800,  true),
  ('Espresso & café', 'Latte',               'Espresso + leche vaporizada, más presencia de leche. Taza de 220ml',              4400,  true),
  ('Espresso & café', 'Piccolo',             'Espresso + leche vaporizada. Taza de 90ml',                                       4200,  true),
  ('Espresso & café', 'Flat white',           'Doble espresso + leche vaporizada, más presencia de café. Taza de 180ml',         4400,  true),
  ('Espresso & café', 'Macchiato',            'Espresso "manchado" con leche vaporizada de textura cremosa. Taza de 90ml',       4200,  true),
  ('Espresso & café', 'Adicional bebida vegetal', '',                                                                            1200,  false),
  ('Espresso & café', 'Chocolatada fría o caliente', '',                                                                        4500,  false),
  -- Filtrados
  ('Filtrados',       'Prensa francesa, V60 y Chemex', '',                                                                      6000,  true),
  -- Té en hebras
  ('Té en hebras',    'Negro (Nacional)',      '',                                                                               4000,  true),
  ('Té en hebras',    'Verde (Importado)',     '',                                                                               6000,  true),
  ('Té en hebras',    'Oolong (Azul) (Importado)', '',                                                                          6000,  true),
  ('Té en hebras',    'Chai con leche (Nacional)', '',                                                                          4000,  true),
  ('Té en hebras',    'Adicional mix de galletitas secas', '',                                                                  4000,  false),
  -- Fríos
  ('Fríos',           'Cold brew',            '',                                                                               5000,  false),
  ('Fríos',           'Espresso tónico',      '',                                                                               5000,  false),
  ('Fríos',           'Yogur con granola',    '',                                                                               6000,  false),
  ('Fríos',           'Licuado de frutas',    '',                                                                               6000,  false),
  -- Infusiones
  ('Infusiones',      'Matcha / Matcha latte','',                                                                               6000,  true),
  ('Infusiones',      'Mate cocido (+ con leche)', '',                                                                          3000,  true),
  -- Panadería
  ('Panadería',       'Medialuna',            '',                                                                               1500,  false),
  ('Panadería',       'Facturas con crema',   '',                                                                               1500,  false),
  ('Panadería',       'Rolls de canela',      '',                                                                               3000,  false),
  ('Panadería',       'Croissant',            '',                                                                               4000,  false),
  ('Panadería',       'Factura danesa',       '',                                                                               4500,  false),
  ('Panadería',       'Fosforito',            '',                                                                               3000,  false),
  ('Panadería',       'Chipá',               '',                                                                               3500,  false),
  ('Panadería',       'Scones de queso',      '',                                                                               2500,  false),
  ('Panadería',       'Pancake',              '',                                                                               6000,  false),
  ('Panadería',       'Biscotti',             '',                                                                               2500,  false),
  ('Panadería',       'Canasta de panes',     '',                                                                               6000,  false),
  ('Panadería',       'Porción de pastelería','',                                                                               7000,  false),
  ('Panadería',       'Alfajor',              '',                                                                               4500,  false),
  ('Panadería',       'Cookies',              '',                                                                               3000,  false),
  -- Entre panes
  ('Entre panes',     'Tostado de jamón y queso', 'En hogaza de trigo',                                                        10000, false),
  ('Entre panes',     'Fresco de queso y rúcula', 'En ciabatta',                                                                8000,  false),
  ('Entre panes',     'Jamón, queso y tomate fresco', 'En brioche',                                                            10000, false),
  -- O casi...
  ('O casi...',       'Tostón de crudo',      'En hogaza de trigo',                                                             9700,  false),
  ('O casi...',       'Tostón de frutas',     'Con pan de algarroba',                                                           9000,  false),
  ('O casi...',       'Palta, huevo y tomates secos', 'Con pan de sarraceno',                                                   8500,  false),
  -- Untables y entradas
  ('Untables y entradas', 'Hummus',           '',                                                                               4000,  false),
  ('Untables y entradas', 'Paté',            'Pasta de queso y yogurth tipo griego, mix de frutos secos + ciboulette, arándanos pasa, miel y oliva', 6000, false),
  ('Untables y entradas', 'Quesos y aceitunas','',                                                                              4000,  false),
  ('Untables y entradas', 'Pan con aceite',   '',                                                                               3000,  false),
  ('Untables y entradas', 'Stracciatella',    '',                                                                               8000,  false),
  ('Untables y entradas', 'Tomate con aceite','Solo de estación',                                                               3500,  false),
  -- Sopa de estación
  ('Sopa de estación','Sopa de tomate frío',  'Tipo gazpacho',                                                                  6000,  false),
  ('Sopa de estación','Sopa Cecilia',         'Caldo de verduras, con fideos cabello de ángel o arroz',                         6000,  false),
  -- Tallarines
  ('Tallarines que piden pan', 'Pomodoro',    'Tomate, ajo y albahaca',                                                        15000, false),
  ('Tallarines que piden pan', 'Tipo Putanesca','Tomate, anchoas, ajo, peperoncino, aceitunas, alcaparras',                    18000, false),
  ('Tallarines que piden pan', 'Bolognesa',   'Clásica de carne',                                                              22000, false),
  ('Tallarines que piden pan', 'Hongos al limón','',                                                                           22000, false),
  -- Sandwiches en focaccia
  ('Sandwiches en focaccia','Mortadela con pistachos','Queso, stracciatella, verdes, pesto y tomates secos',                   25000, false),
  ('Sandwiches en focaccia','Berenjenas asadas','Morrón asado, tomate confitado, queso, lactonesa de apio',                    20000, false),
  ('Sandwiches en focaccia','Lomo salteado',  'Morrones asados, pepinillos en conserva y mostaza tipo dijon',                  25000, false),
  ('Sandwiches en focaccia','Pollo braseado', 'Verdes hidropónicos, tomate confitado y lactonesa de apio',                     25000, false),
  ('Sandwiches en focaccia','Gravlax',        'Stracciatella, palta al limón, salsa de manzana y mostaza',                     35000, false),
  -- Ensaladas
  ('Ensaladas',       'Ensalada de pollo',    'Pollo, garbanzos, mix de hojas hidropónicas, tomates secos, crutones y frutos secos. Aliño: oliva, limón y yogur', 15000, false),
  ('Ensaladas',       'Ensalada de solomillo','Solomillo, zanahorias al horno, mix de hojas hidropónicas, manzana fresca, queso y nueces tostadas. Aliño: mostaza dijon, limón, oliva y miel', 15000, false),
  ('Ensaladas',       'Ensalada de huevo mollet','Huevo mollet, lentejas cocidas, mix de hojas hidropónicas, pan tostado, queso, hierbas frescas. Aliño: limón y oliva', 12000, false),
  ('Ensaladas',       'Ensalada de hongos',   'Hongos salteados, pasta fría, mix de hojas hidropónicas, queso semiduro, nueces y semillas. Aliño: oliva, ajo y limón', 15000, false),
  -- Postres
  ('Postres',         'Flan Cecilia',         'Como lo hacía mamá. Sale con ganache montada de vainilla o dulce de leche',      4000,  false),
  ('Postres',         'Budín de medialunas',  'Con café con leche',                                                             4000,  false),
  ('Postres',         'Tostada francesa tiramisú','Salsa inglesa de café, crema de queso, cacao',                              6000,  false),
  -- Bebidas sin alcohol
  ('Bebidas sin alcohol','Agua o Soda de la casa','',                                                                           1500,  false),
  ('Bebidas sin alcohol','Coca Cola (330ml)', '',                                                                               3000,  false),
  ('Bebidas sin alcohol','Schweppes',         'Pomelo o tónica (500ml)',                                                        4000,  false),
  ('Bebidas sin alcohol','Vaso de limonada de yerba mate','',                                                                   3000,  false),
  ('Bebidas sin alcohol','Jugos en vaso',     '',                                                                               3000,  false),
  ('Bebidas sin alcohol','Jarra de limón, jengibre, almíbar de cedrón y menta','',                                             7000,  false),
  ('Bebidas sin alcohol','Jarra de naranjada','',                                                                               7000,  false),
  ('Bebidas sin alcohol','Jarra de hibiscus, naranja y frutos rojos','',                                                        6000,  false),
  ('Bebidas sin alcohol','Cerveza Heineken (330ml)','',                                                                         6000,  false),
  ('Bebidas sin alcohol','Cerveza Corona (330ml)','',                                                                           4500,  false)
) AS p(cat, nombre, descripcion, precio, es_infusion)
JOIN categorias c ON c.nombre = p.cat
WHERE NOT EXISTS (SELECT 1 FROM productos);
