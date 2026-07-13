-- Elimina producto y categoría Menú Ejecutivo
DELETE FROM productos
WHERE nombre = 'Menú Ejecutivo'
  AND categoria_id = (SELECT id FROM categorias WHERE nombre = 'Menú Ejecutivo' AND seccion = 'Almuerzo');

DELETE FROM categorias WHERE nombre = 'Menú Ejecutivo' AND seccion = 'Almuerzo';

-- Restaura el constraint original con solo las dos secciones originales
ALTER TABLE categorias DROP CONSTRAINT categorias_seccion_check;
ALTER TABLE categorias ADD CONSTRAINT categorias_seccion_check
    CHECK (seccion = ANY (ARRAY['Cafetería'::text, 'Cocina de mediodía'::text]));
