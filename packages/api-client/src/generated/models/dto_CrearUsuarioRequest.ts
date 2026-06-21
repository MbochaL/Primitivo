/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type dto_CrearUsuarioRequest = {
    email: string;
    password: string;
    rol: dto_CrearUsuarioRequest.rol;
};
export namespace dto_CrearUsuarioRequest {
    export enum rol {
        ADMINISTRADOR = 'administrador',
        OPERADOR = 'operador',
    }
}

