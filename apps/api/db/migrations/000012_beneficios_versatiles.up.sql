-- Agrega columnas para beneficios versátiles y dinámicos.
-- Todas las columnas tienen DEFAULT para mantener compatibilidad con filas existentes.

ALTER TABLE condiciones
  ADD COLUMN tipo_trigger TEXT NOT NULL DEFAULT 'contador'
    CONSTRAINT chk_condiciones_tipo_trigger
      CHECK (tipo_trigger IN ('siempre', 'dias_semana', 'contador')),

  -- Días de la semana para tipo_trigger='dias_semana' (0=domingo..6=sábado, convención Go time.Weekday)
  ADD COLUMN dias_semana INTEGER[] NULL,

  -- Qué se cuenta para tipo_trigger='contador'
  ADD COLUMN scope_trigger TEXT NOT NULL DEFAULT 'infusiones'
    CONSTRAINT chk_condiciones_scope_trigger
      CHECK (scope_trigger IN ('infusiones', 'categoria', 'producto')),
  ADD COLUMN scope_trigger_categoria_id UUID NULL REFERENCES categorias(id) ON DELETE SET NULL,
  ADD COLUMN scope_trigger_producto_id  UUID NULL REFERENCES productos(id)  ON DELETE SET NULL,

  -- Qué parte del subtotal recibe el descuento
  ADD COLUMN scope_descuento TEXT NOT NULL DEFAULT 'total'
    CONSTRAINT chk_condiciones_scope_descuento
      CHECK (scope_descuento IN ('total', 'categoria')),
  ADD COLUMN scope_descuento_categoria_id UUID NULL REFERENCES categorias(id) ON DELETE SET NULL;

-- Ampliar tipo_descuento para incluir 'producto_gratis'.
-- La columna tiene un CHECK inline; en Postgres el nombre autogenerado es <tabla>_<columna>_check.
ALTER TABLE condiciones
  DROP CONSTRAINT IF EXISTS condiciones_tipo_descuento_check;

ALTER TABLE condiciones
  ADD CONSTRAINT chk_condiciones_tipo_descuento
    CHECK (tipo_descuento IN ('porcentaje', 'monto_fijo', 'producto_gratis'));

-- Para 'producto_gratis', scope_descuento_categoria_id identifica la categoría del producto gratuito;
-- valor_descuento se ignora pero la constraint de porcentaje_max solo aplica a 'porcentaje'.
-- Actualizar constraint existente de porcentaje_max (ya es correcta, pero la reaseguramos por nombre):
ALTER TABLE condiciones
  DROP CONSTRAINT IF EXISTS chk_condiciones_porcentaje_max;

ALTER TABLE condiciones
  ADD CONSTRAINT chk_condiciones_porcentaje_max
    CHECK (tipo_descuento <> 'porcentaje' OR valor_descuento <= 100);
