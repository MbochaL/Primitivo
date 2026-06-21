/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { dto_CategoriaMenuResponse } from '../models/dto_CategoriaMenuResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MenuService {
    /**
     * Menú completo agrupado por categoría
     * @returns dto_CategoriaMenuResponse OK
     * @throws ApiError
     */
    public static getMenu(): CancelablePromise<Array<dto_CategoriaMenuResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/menu',
        });
    }
}
