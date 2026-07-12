-- Permite beneficios globales (sin institución): si institucion_id es NULL,
-- el beneficio aplica a cualquier cliente independientemente de su institución.
ALTER TABLE beneficios ALTER COLUMN institucion_id DROP NOT NULL;
