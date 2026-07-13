-- Vuelve a la doctrina original: todo cliente y todo beneficio debe tener institución.
-- 1. Asegurar que existe la institución "Fiduciaria" (crearla si no existe).
-- 2. Asignar los clientes sin institución a "Fiduciaria".
-- 3. Asignar cualquier beneficio sin institución a "Fiduciaria".
-- 4. Hacer NOT NULL ambas columnas.
DO $$
DECLARE fiduciaria_id UUID;
BEGIN
    SELECT id INTO fiduciaria_id
    FROM instituciones
    WHERE nombre ILIKE 'fiduciaria%'
    ORDER BY created_at
    LIMIT 1;

    IF fiduciaria_id IS NULL THEN
        INSERT INTO instituciones (id, nombre)
        VALUES (gen_random_uuid(), 'Fiduciaria')
        RETURNING id INTO fiduciaria_id;
    END IF;

    UPDATE clientes SET institucion_id = fiduciaria_id WHERE institucion_id IS NULL;
    UPDATE beneficios SET institucion_id = fiduciaria_id WHERE institucion_id IS NULL;
END $$;

ALTER TABLE clientes ALTER COLUMN institucion_id SET NOT NULL;
ALTER TABLE beneficios ALTER COLUMN institucion_id SET NOT NULL;
