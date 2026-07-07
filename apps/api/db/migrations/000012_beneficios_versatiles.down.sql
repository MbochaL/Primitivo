ALTER TABLE condiciones
  DROP CONSTRAINT IF EXISTS chk_condiciones_porcentaje_max,
  DROP CONSTRAINT IF EXISTS chk_condiciones_tipo_descuento;

ALTER TABLE condiciones
  ADD CONSTRAINT condiciones_tipo_descuento_check
    CHECK (tipo_descuento IN ('porcentaje', 'monto_fijo'));

ALTER TABLE condiciones
  ADD CONSTRAINT chk_condiciones_porcentaje_max
    CHECK (tipo_descuento <> 'porcentaje' OR valor_descuento <= 100);

ALTER TABLE condiciones
  DROP COLUMN IF EXISTS scope_descuento_categoria_id,
  DROP COLUMN IF EXISTS scope_descuento,
  DROP COLUMN IF EXISTS scope_trigger_producto_id,
  DROP COLUMN IF EXISTS scope_trigger_categoria_id,
  DROP COLUMN IF EXISTS scope_trigger,
  DROP COLUMN IF EXISTS dias_semana,
  DROP COLUMN IF EXISTS tipo_trigger;
