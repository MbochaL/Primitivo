ALTER TABLE beneficios ADD COLUMN institucion_id UUID REFERENCES instituciones(id) ON DELETE RESTRICT;

UPDATE beneficios b
SET institucion_id = (
    SELECT bi.institucion_id
    FROM beneficio_instituciones bi
    WHERE bi.beneficio_id = b.id
    ORDER BY bi.institucion_id
    LIMIT 1
);

ALTER TABLE beneficios ALTER COLUMN institucion_id SET NOT NULL;

DROP TABLE beneficio_instituciones;
