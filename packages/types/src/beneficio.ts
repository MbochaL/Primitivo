import type { Monto, TipoDescuento, UUID } from './common';

export interface Condicion {
  id: UUID;
  beneficioId: UUID;
  umbralInfusiones: number;
  tipoDescuento: TipoDescuento;
  valorDescuento: number;
  reiniciaContador: boolean;
  vigente: boolean;
}

export interface Beneficio {
  id: UUID;
  institucionId: UUID;
  nombre: string;
  activo: boolean;
}

export interface BeneficioConCondiciones extends Beneficio {
  condiciones: Condicion[];
}

/** Beneficio disponible para un cliente según su contador de infusiones. */
export interface BeneficioDisponible {
  beneficio: Beneficio;
  condicion: Condicion;
  contadorActual: number;
  descuentoEstimado: Monto;
}
