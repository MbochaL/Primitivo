/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type dto_CrearCategoriaRequest = {
    nombre: string;
    orden?: number;
    seccion: dto_CrearCategoriaRequest.seccion;
};
export namespace dto_CrearCategoriaRequest {
    export enum seccion {
        CAFETER_A = 'Cafetería',
        COCINA_DE_MEDIOD_A = 'Cocina de mediodía',
    }
}

