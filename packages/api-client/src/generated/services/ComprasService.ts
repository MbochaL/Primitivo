/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { dto_CompraRegistradaResponse } from '../models/dto_CompraRegistradaResponse';
import type { dto_RegistrarCompraRequest } from '../models/dto_RegistrarCompraRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ComprasService {
    /**
     * Registrar una compra (calcula total y aplica beneficio si corresponde)
     * @returns dto_CompraRegistradaResponse Created
     * @throws ApiError
     */
    public static postCompras({
        requestBody,
    }: {
        /**
         * Pedido
         */
        requestBody: dto_RegistrarCompraRequest,
    }): CancelablePromise<dto_CompraRegistradaResponse> {
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
