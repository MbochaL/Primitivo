-- Amplía el constraint de sección para incluir 'Almuerzo' (ordena antes que Cafetería y Cocina)
ALTER TABLE categorias DROP CONSTRAINT categorias_seccion_check;
ALTER TABLE categorias ADD CONSTRAINT categorias_seccion_check
    CHECK (seccion = ANY (ARRAY['Almuerzo'::text, 'Cafetería'::text, 'Cocina de mediodía'::text]));

-- Categoría Menú Ejecutivo (orden=0 → primera dentro de la sección Almuerzo)
INSERT INTO categorias (nombre, seccion, orden)
VALUES ('Menú Ejecutivo', 'Almuerzo', 0);

-- Producto Menú Ejecutivo $20000 en esa categoría
INSERT INTO productos (nombre, precio, descripcion, es_infusion, activo, categoria_id)
SELECT 'Menú Ejecutivo', 20000, '', false, true, id
FROM categorias
WHERE nombre = 'Menú Ejecutivo' AND seccion = 'Almuerzo';
