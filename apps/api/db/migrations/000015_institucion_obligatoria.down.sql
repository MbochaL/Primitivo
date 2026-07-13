-- Revierte: permite NULL en institucion_id de clientes y beneficios.
ALTER TABLE clientes ALTER COLUMN institucion_id DROP NOT NULL;
ALTER TABLE beneficios ALTER COLUMN institucion_id DROP NOT NULL;
