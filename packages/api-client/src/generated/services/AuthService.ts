/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { dto_LoginRequest } from '../models/dto_LoginRequest';
import type { dto_RefreshRequest } from '../models/dto_RefreshRequest';
import type { dto_TokenResponse } from '../models/dto_TokenResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * Iniciar sesión
     * @param requestBody Credenciales
     * @returns dto_TokenResponse OK
     * @throws ApiError
     */
    public static postAuthLogin(
        requestBody: dto_LoginRequest,
    ): CancelablePromise<dto_TokenResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Renovar tokens
     * @param requestBody Refresh token
     * @returns dto_TokenResponse OK
     * @throws ApiError
     */
    public static postAuthRefresh(
        requestBody: dto_RefreshRequest,
    ): CancelablePromise<dto_TokenResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/refresh',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
            },
        });
    }
}
