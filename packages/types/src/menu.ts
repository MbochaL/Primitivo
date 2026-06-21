import type { Monto, Seccion, UUID } from './common';

export interface Categoria {
  id: UUID;
  nombre: string;
  seccion: Seccion;
  orden: number;
}

export interface Producto {
  id: UUID;
  categoriaId: UUID;
  nombre: string;
  precio: Monto;
  esInfusion: boolean;
  activo: boolean;
}

/** Menú completo agrupado por categoría, tal como lo expone GET /menu. */
export interface CategoriaConProductos extends Categoria {
  productos: Producto[];
}
