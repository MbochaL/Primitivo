/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { dto_ActualizarClienteRequest } from '../models/dto_ActualizarClienteRequest';
import type { dto_BeneficioDisponibleResponse } from '../models/dto_BeneficioDisponibleResponse';
import type { dto_ClienteResponse } from '../models/dto_ClienteResponse';
import type { dto_CompraResponse } from '../models/dto_CompraResponse';
import type { dto_CrearClienteRequest } from '../models/dto_CrearClienteRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ClientesService {
    /**
     * Listar clientes (o buscar por DNI con ?dni=)
     * @returns dto_ClienteResponse OK
     * @throws ApiError
     */
    public static getClientes({
        dni,
    }: {
        /**
         * Buscar por DNI exacto (búsqueda principal del dashboard)
         */
        dni?: string,
    }): CancelablePromise<Array<dto_ClienteResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/clientes',
            query: {
                'dni': dni,
            },
        });
    }
    /**
     * Registrar un cliente
     * @returns dto_ClienteResponse Created
     * @throws ApiError
     */
    public static postClientes({
        requestBody,
    }: {
        /**
         * Datos del cliente
         */
        requestBody: dto_CrearClienteRequest,
    }): CancelablePromise<dto_ClienteResponse> {
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
     * Obtener un cliente por ID
     * @returns dto_ClienteResponse OK
     * @throws ApiError
     */
    public static getClientes1({
        id,
    }: {
        /**
         * ID del cliente
         */
        id: string,
    }): CancelablePromise<dto_ClienteResponse> {
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
     * Actualizar un cliente
     * @returns dto_ClienteResponse OK
     * @throws ApiError
     */
    public static putClientes({
        id,
        requestBody,
    }: {
        /**
         * ID del cliente
         */
        id: string,
        /**
         * Datos a actualizar
         */
        requestBody: dto_ActualizarClienteRequest,
    }): CancelablePromise<dto_ClienteResponse> {
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
     * @returns dto_BeneficioDisponibleResponse OK
     * @throws ApiError
     */
    public static getClientesBeneficios({
        id,
    }: {
        /**
         * ID del cliente
         */
        id: string,
    }): CancelablePromise<Array<dto_BeneficioDisponibleResponse>> {
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
     * @returns dto_CompraResponse OK
     * @throws ApiError
     */
    public static getClientesHistorial({
        id,
    }: {
        /**
         * ID del cliente
         */
        id: string,
    }): CancelablePromise<Array<dto_CompraResponse>> {
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
