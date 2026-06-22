/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { dto_ActualizarBeneficioRequest } from '../models/dto_ActualizarBeneficioRequest';
import type { dto_ActualizarCondicionRequest } from '../models/dto_ActualizarCondicionRequest';
import type { dto_BeneficioAdminResponse } from '../models/dto_BeneficioAdminResponse';
import type { dto_CondicionResponse } from '../models/dto_CondicionResponse';
import type { dto_CrearBeneficioRequest } from '../models/dto_CrearBeneficioRequest';
import type { dto_CrearCondicionRequest } from '../models/dto_CrearCondicionRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BeneficiosService {
    /**
     * Listar beneficios con sus condiciones e institución (admin)
     * @returns dto_BeneficioAdminResponse OK
     * @throws ApiError
     */
    public static getBeneficios(): CancelablePromise<Array<dto_BeneficioAdminResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/beneficios',
        });
    }
    /**
     * Crear beneficio (admin)
     * @param requestBody Beneficio
     * @returns dto_BeneficioAdminResponse Created
     * @throws ApiError
     */
    public static postBeneficios(
        requestBody: dto_CrearBeneficioRequest,
    ): CancelablePromise<dto_BeneficioAdminResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/beneficios',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Actualizar beneficio (admin)
     * @param id ID beneficio
     * @param requestBody Beneficio
     * @returns dto_BeneficioAdminResponse OK
     * @throws ApiError
     */
    public static putBeneficios(
        id: string,
        requestBody: dto_ActualizarBeneficioRequest,
    ): CancelablePromise<dto_BeneficioAdminResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/beneficios/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Desactivar beneficio (admin)
     * @param id ID beneficio
     * @returns dto_BeneficioAdminResponse OK
     * @throws ApiError
     */
    public static deleteBeneficios(
        id: string,
    ): CancelablePromise<dto_BeneficioAdminResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/beneficios/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Agregar condición a un beneficio (admin)
     * @param id ID beneficio
     * @param requestBody Condición
     * @returns dto_CondicionResponse Created
     * @throws ApiError
     */
    public static postBeneficiosCondiciones(
        id: string,
        requestBody: dto_CrearCondicionRequest,
    ): CancelablePromise<dto_CondicionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/beneficios/{id}/condiciones',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Actualizar condición (admin)
     * @param id ID condición
     * @param requestBody Condición
     * @returns dto_CondicionResponse OK
     * @throws ApiError
     */
    public static putCondiciones(
        id: string,
        requestBody: dto_ActualizarCondicionRequest,
    ): CancelablePromise<dto_CondicionResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/condiciones/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
