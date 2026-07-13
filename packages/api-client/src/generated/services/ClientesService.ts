/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { dto_ActualizarClienteRequest } from '../models/dto_ActualizarClienteRequest';
import type { dto_BeneficioDisponibleResponse } from '../models/dto_BeneficioDisponibleResponse';
import type { dto_ClienteResponse } from '../models/dto_ClienteResponse';
import type { dto_CompraResponse } from '../models/dto_CompraResponse';
import type { dto_CrearClienteRequest } from '../models/dto_CrearClienteRequest';
import type { dto_ImportarClientesRequest } from '../models/dto_ImportarClientesRequest';
import type { dto_ImportarClientesResponse } from '../models/dto_ImportarClientesResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ClientesService {
    /**
     * Listar clientes (o buscar por DNI con ?dni=)
     * @param dni Buscar por DNI exacto (búsqueda principal del dashboard)
     * @returns dto_ClienteResponse OK
     * @throws ApiError
     */
    public static getClientes(
        dni?: string,
        q?: string,
    ): CancelablePromise<Array<dto_ClienteResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/clientes',
            query: {
                'dni': dni,
                'q': q,
            },
        });
    }
    /**
     * Registrar un cliente
     * @param requestBody Datos del cliente
     * @returns dto_ClienteResponse Created
     * @throws ApiError
     */
    public static postClientes(
        requestBody: dto_CrearClienteRequest,
    ): CancelablePromise<dto_ClienteResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/clientes',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
            },
        });
    }
    /**
     * Importar clientes en lote (solo administrador)
     * @param requestBody Lista de clientes a importar
     * @returns dto_ImportarClientesResponse OK
     * @throws ApiError
     */
    public static postClientesImportar(
        requestBody: dto_ImportarClientesRequest,
    ): CancelablePromise<dto_ImportarClientesResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/clientes/importar',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * Obtener un cliente por ID
     * @param id ID del cliente
     * @returns dto_ClienteResponse OK
     * @throws ApiError
     */
    public static getClientes1(
        id: string,
    ): CancelablePromise<dto_ClienteResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/clientes/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * Eliminar un cliente (solo administrador)
     * @param id ID del cliente
     * @returns void
     * @throws ApiError
     */
    public static deleteClientes(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/clientes/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * Actualizar un cliente
     * @param id ID del cliente
     * @param requestBody Datos a actualizar
     * @returns dto_ClienteResponse OK
     * @throws ApiError
     */
    public static putClientes(
        id: string,
        requestBody: dto_ActualizarClienteRequest,
    ): CancelablePromise<dto_ClienteResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/clientes/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * Beneficios disponibles del cliente
     * @param id ID del cliente
     * @returns dto_BeneficioDisponibleResponse OK
     * @throws ApiError
     */
    public static getClientesBeneficios(
        id: string,
    ): CancelablePromise<Array<dto_BeneficioDisponibleResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/clientes/{id}/beneficios',
            path: {
                'id': id,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * Historial de compras del cliente
     * @param id ID del cliente
     * @returns dto_CompraResponse OK
     * @throws ApiError
     */
    public static getClientesHistorial(
        id: string,
    ): CancelablePromise<Array<dto_CompraResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/clientes/{id}/historial',
            path: {
                'id': id,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
}
