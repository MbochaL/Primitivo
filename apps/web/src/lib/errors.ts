import { ApiError } from '@primitivo/api-client';

/**
 * Traduce cualquier error (de la API o de red) a un mensaje claro en español, listo para
 * mostrar en un toast. Nunca expone detalles crudos.
 */
export function mensajeDeError(err: unknown): string {
  if (err instanceof ApiError) {
    // El backend responde { error: { codigo, mensaje } }.
    const body = err.body as { error?: { mensaje?: string } } | undefined;
    if (body?.error?.mensaje) {
      return body.error.mensaje;
    }
    switch (err.status) {
      case 400:
        return 'Datos inválidos. Revisá el formulario.';
      case 401:
        return 'Tu sesión expiró. Iniciá sesión de nuevo.';
      case 403:
        return 'No tenés permiso para esta acción.';
      case 404:
        return 'No se encontró el recurso.';
      case 409:
        return 'El recurso ya existe o está en conflicto.';
      default:
        return `Error del servidor (${err.status}).`;
    }
  }
  return 'No se pudo conectar con el servidor. Verificá tu conexión.';
}
