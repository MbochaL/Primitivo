import type { ISODateString, Rol, UUID } from './common';

export interface Institucion {
  id: UUID;
  nombre: string;
  activa: boolean;
  createdAt: ISODateString;
}

export interface Cliente {
  id: UUID;
  dni: string;
  nombre: string;
  email: string | null;
  institucionId: UUID | null;
  contadorInfusiones: number;
  createdAt: ISODateString;
}

export interface Usuario {
  id: UUID;
  email: string;
  rol: Rol;
  activo: boolean;
}
