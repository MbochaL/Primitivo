/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { dto_ActualizarInstitucionRequest } from '../models/dto_ActualizarInstitucionRequest';
import type { dto_CrearInstitucionRequest } from '../models/dto_CrearInstitucionRequest';
import type { dto_InstitucionResponse } from '../models/dto_InstitucionResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class InstitucionesService {
    /**
     * Listar instituciones
     * @returns dto_InstitucionResponse OK
     * @throws ApiError
     */
    public static getInstituciones(): CancelablePromise<Array<dto_InstitucionResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/instituciones',
        });
    }
    /**
     * Crear una institución
     * @param requestBody Datos de la institución
     * @returns dto_InstitucionResponse Created
     * @throws ApiError
     */
    public static postInstituciones(
        requestBody: dto_CrearInstitucionRequest,
    ): CancelablePromise<dto_InstitucionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/instituciones',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * Actualizar una institución
     * @param id ID de la institución
     * @param requestBody Datos a actualizar
     * @returns dto_InstitucionResponse OK
     * @throws ApiError
     */
    public static putInstituciones(
        id: string,
        requestBody: dto_ActualizarInstitucionRequest,
    ): CancelablePromise<dto_InstitucionResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/instituciones/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
            },
        });
    }
}
