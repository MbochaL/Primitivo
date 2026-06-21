/** Identificador único (UUID v4) serializado como string. */
export type UUID = string;

/** Timestamp en formato ISO 8601 (RFC 3339). */
export type ISODateString = string;

/** Monto entero en la unidad mínima de la moneda (centavos). */
export type Monto = number;

/** Roles de usuario del sistema. */
export type Rol = 'administrador' | 'operador';

/** Secciones de primer nivel del menú. */
export type Seccion = 'Cafetería' | 'Cocina de mediodía';

/** Tipo de descuento que aplica una condición de beneficio. */
export type TipoDescuento = 'porcentaje' | 'monto_fijo';
