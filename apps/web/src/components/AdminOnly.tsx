import { type ReactNode } from 'react';

import { useAuth } from '@/lib/auth';

/**
 * Renderiza sus hijos solo si el usuario es administrador. Para ocultar acciones de
 * gestión (crear/editar/borrar menú, beneficios, instituciones, usuarios) al operador,
 * según la sección 9 del documento maestro.
 *
 *   <AdminOnly><Button title="Nuevo" .../></AdminOnly>
 *
 * Para lógica condicional fina, usar directamente `useAuth().esAdmin`.
 */
export function AdminOnly({ children }: { children: ReactNode }) {
  const { esAdmin } = useAuth();
  return esAdmin ? <>{children}</> : null;
}
