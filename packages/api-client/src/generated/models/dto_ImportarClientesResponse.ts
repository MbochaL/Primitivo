/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type dto_ImportarClientesResponse = {
    creados: number;
    duplicados: number;
    errores: Array<{
        dni: string;
        nombre: string;
        error: string;
    }>;
};
