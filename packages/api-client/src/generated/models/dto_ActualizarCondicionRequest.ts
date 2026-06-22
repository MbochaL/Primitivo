/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type dto_ActualizarCondicionRequest = {
    reinicia_contador?: boolean;
    tipo_descuento: dto_ActualizarCondicionRequest.tipo_descuento;
    umbral_infusiones?: number;
    valor_descuento?: number;
    vigente?: boolean;
};
export namespace dto_ActualizarCondicionRequest {
    export enum tipo_descuento {
        PORCENTAJE = 'porcentaje',
        MONTO_FIJO = 'monto_fijo',
    }
}

