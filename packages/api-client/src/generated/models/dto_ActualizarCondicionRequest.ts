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
    tipo_trigger?: dto_ActualizarCondicionRequest.tipo_trigger;
    dias_semana?: Array<number>;
    scope_trigger?: dto_ActualizarCondicionRequest.scope_trigger;
    scope_trigger_categoria_id?: string | null;
    scope_trigger_producto_id?: string | null;
    scope_descuento?: dto_ActualizarCondicionRequest.scope_descuento;
    scope_descuento_categoria_id?: string | null;
};
export namespace dto_ActualizarCondicionRequest {
    export enum tipo_descuento {
        PORCENTAJE = 'porcentaje',
        MONTO_FIJO = 'monto_fijo',
        PRODUCTO_GRATIS = 'producto_gratis',
    }
    export enum tipo_trigger {
        SIEMPRE = 'siempre',
        DIAS_SEMANA = 'dias_semana',
        CONTADOR = 'contador',
    }
    export enum scope_trigger {
        INFUSIONES = 'infusiones',
        CATEGORIA = 'categoria',
        PRODUCTO = 'producto',
    }
    export enum scope_descuento {
        TOTAL = 'total',
        CATEGORIA = 'categoria',
    }
}
