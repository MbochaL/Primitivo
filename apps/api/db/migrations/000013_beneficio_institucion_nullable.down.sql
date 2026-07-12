-- Restaura la restricción NOT NULL (requiere que no existan beneficios sin institución).
ALTER TABLE beneficios ALTER COLUMN institucion_id SET NOT NULL;
