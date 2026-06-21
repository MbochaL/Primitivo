-- Instituciones con convenio. Agrupan clientes y ofrecen beneficios.
CREATE TABLE instituciones (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre     TEXT        NOT NULL,
    activa     BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
