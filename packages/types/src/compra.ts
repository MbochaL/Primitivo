import type { ISODateString, Monto, UUID } from './common';

export interface DetalleCompra {
  id: UUID;
  compraId: UUID;
  productoId: UUID;
  cantidad: number;
  precioUnitario: Monto;
}

export interface Compra {
  id: UUID;
  clienteId: UUID;
  usuarioId: UUID;
  subtotal: Monto;
  descuento: Monto;
  total: Monto;
  fecha: ISODateString;
}

export interface CompraConDetalle extends Compra {
  detalles: DetalleCompra[];
}

export interface Canje {
  id: UUID;
  clienteId: UUID;
  beneficioId: UUID;
  condicionId: UUID;
  compraId: UUID;
  usuarioId: UUID;
  descuentoAplicado: Monto;
  fecha: ISODateString;
}
