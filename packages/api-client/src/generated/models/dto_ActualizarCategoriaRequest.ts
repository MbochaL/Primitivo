/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type dto_ActualizarCategoriaRequest = {
    nombre: string;
    orden?: number;
    seccion: dto_ActualizarCategoriaRequest.seccion;
};
export namespace dto_ActualizarCategoriaRequest {
    export enum seccion {
        CAFETER_A = 'Cafetería',
        COCINA_DE_MEDIOD_A = 'Cocina de mediodía',
    }
}

