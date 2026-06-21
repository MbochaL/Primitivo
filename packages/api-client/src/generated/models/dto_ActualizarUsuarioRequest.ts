/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type dto_ActualizarUsuarioRequest = {
    activo: boolean;
    email: string;
    rol: dto_ActualizarUsuarioRequest.rol;
};
export namespace dto_ActualizarUsuarioRequest {
    export enum rol {
        ADMINISTRADOR = 'administrador',
        OPERADOR = 'operador',
    }
}

