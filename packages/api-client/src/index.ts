/**
 * Cliente TypeScript de la API de Primitivo.
 *
 * El contenido de `./generated` lo produce `pnpm generate:client` desde el spec OpenAPI
 * del backend (swaggo → swagger2openapi → openapi-typescript-codegen).
 * No editar `./generated` a mano.
 */
import { OpenAPI } from './generated';

export * from './generated';

/** Configura la URL base de la API (llamar una vez al arrancar la app). */
export function setApiBaseUrl(url: string): void {
  OpenAPI.BASE = url;
}

/** Devuelve la URL base configurada. */
export function getApiBaseUrl(): string {
  return OpenAPI.BASE;
}

/** Configura (o limpia) el bearer token que el cliente envía en cada request. */
export function setAuthToken(token: string | undefined): void {
  OpenAPI.TOKEN = token;
}
