/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { dto_CompraListaResponse } from '../models/dto_CompraListaResponse';
import type { dto_CompraRegistradaResponse } from '../models/dto_CompraRegistradaResponse';
import type { dto_RegistrarCompraRequest } from '../models/dto_RegistrarCompraRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ComprasService {
    /**
     * Listar compras en un rango de fechas (admin)
     * @param desde Fecha inicio (YYYY-MM-DD)
     * @param hasta Fecha fin exclusiva (YYYY-MM-DD)
     * @returns dto_CompraListaResponse OK
     * @throws ApiError
     */
    public static getCompras(
        desde?: string,
        hasta?: string,
    ): CancelablePromise<Array<dto_CompraListaResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/compras',
            query: { desde, hasta },
        });
    }
    /**
     * Registrar una compra (calcula total y aplica beneficio si corresponde)
     * @param requestBody Pedido
     * @returns dto_CompraRegistradaResponse Created
     * @throws ApiError
     */
    public static postCompras(
        requestBody: dto_RegistrarCompraRequest,
    ): CancelablePromise<dto_CompraRegistradaResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/compras',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
            },
        });
    }
}
