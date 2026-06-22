/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { dto_ActualizarCategoriaRequest } from '../models/dto_ActualizarCategoriaRequest';
import type { dto_ActualizarProductoRequest } from '../models/dto_ActualizarProductoRequest';
import type { dto_CategoriaAdminResponse } from '../models/dto_CategoriaAdminResponse';
import type { dto_CategoriaMenuResponse } from '../models/dto_CategoriaMenuResponse';
import type { dto_CrearCategoriaRequest } from '../models/dto_CrearCategoriaRequest';
import type { dto_CrearProductoRequest } from '../models/dto_CrearProductoRequest';
import type { dto_ProductoAdminResponse } from '../models/dto_ProductoAdminResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MenuService {
    /**
     * Lista todas las categorías (admin)
     * @returns dto_CategoriaAdminResponse OK
     * @throws ApiError
     */
    public static getCategorias(): CancelablePromise<Array<dto_CategoriaAdminResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/categorias',
        });
    }
    /**
     * Crear categoría (admin)
     * @param requestBody Categoría
     * @returns dto_CategoriaAdminResponse Created
     * @throws ApiError
     */
    public static postCategorias(
        requestBody: dto_CrearCategoriaRequest,
    ): CancelablePromise<dto_CategoriaAdminResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/categorias',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Actualizar categoría (admin)
     * @param id ID categoría
     * @param requestBody Categoría
     * @returns dto_CategoriaAdminResponse OK
     * @throws ApiError
     */
    public static putCategorias(
        id: string,
        requestBody: dto_ActualizarCategoriaRequest,
    ): CancelablePromise<dto_CategoriaAdminResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/categorias/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Menú completo agrupado por categoría (solo activos)
     * @returns dto_CategoriaMenuResponse OK
     * @throws ApiError
     */
    public static getMenu(): CancelablePromise<Array<dto_CategoriaMenuResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/menu',
        });
    }
    /**
     * Lista todos los productos incluyendo inactivos (admin)
     * @returns dto_ProductoAdminResponse OK
     * @throws ApiError
     */
    public static getProductos(): CancelablePromise<Array<dto_ProductoAdminResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/productos',
        });
    }
    /**
     * Crear producto (admin)
     * @param requestBody Producto
     * @returns dto_ProductoAdminResponse Created
     * @throws ApiError
     */
    public static postProductos(
        requestBody: dto_CrearProductoRequest,
    ): CancelablePromise<dto_ProductoAdminResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/productos',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Actualizar producto (admin)
     * @param id ID producto
     * @param requestBody Producto
     * @returns dto_ProductoAdminResponse OK
     * @throws ApiError
     */
    public static putProductos(
        id: string,
        requestBody: dto_ActualizarProductoRequest,
    ): CancelablePromise<dto_ProductoAdminResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/productos/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Baja lógica de producto (admin)
     * @param id ID producto
     * @returns dto_ProductoAdminResponse OK
     * @throws ApiError
     */
    public static deleteProductos(
        id: string,
    ): CancelablePromise<dto_ProductoAdminResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/productos/{id}',
            path: {
                'id': id,
            },
        });
    }
}
