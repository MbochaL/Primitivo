/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { dto_ActualizarUsuarioRequest } from '../models/dto_ActualizarUsuarioRequest';
import type { dto_CrearUsuarioRequest } from '../models/dto_CrearUsuarioRequest';
import type { dto_ResetPasswordRequest } from '../models/dto_ResetPasswordRequest';
import type { dto_UsuarioResponse } from '../models/dto_UsuarioResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UsuariosService {
    /**
     * Listar usuarios del sistema
     * @returns dto_UsuarioResponse OK
     * @throws ApiError
     */
    public static getUsuarios(): CancelablePromise<Array<dto_UsuarioResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/usuarios',
        });
    }
    /**
     * Crear un usuario del sistema
     * @returns dto_UsuarioResponse Created
     * @throws ApiError
     */
    public static postUsuarios({
        requestBody,
    }: {
        /**
         * Datos del usuario
         */
        requestBody: dto_CrearUsuarioRequest,
    }): CancelablePromise<dto_UsuarioResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/usuarios',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
            },
        });
    }
    /**
     * Actualizar un usuario del sistema
     * @returns dto_UsuarioResponse OK
     * @throws ApiError
     */
    public static putUsuarios({
        id,
        requestBody,
    }: {
        /**
         * ID del usuario
         */
        id: string,
        /**
         * Datos a actualizar
         */
        requestBody: dto_ActualizarUsuarioRequest,
    }): CancelablePromise<dto_UsuarioResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/usuarios/{id}',
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
    /**
     * Resetear la contraseña de un usuario
     * @returns void
     * @throws ApiError
     */
    public static putUsuariosPassword({
        id,
        requestBody,
    }: {
        /**
         * ID del usuario
         */
        id: string,
        /**
         * Nueva contraseña
         */
        requestBody: dto_ResetPasswordRequest,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/usuarios/{id}/password',
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
