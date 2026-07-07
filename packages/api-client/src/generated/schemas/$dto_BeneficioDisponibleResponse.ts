/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $dto_BeneficioDisponibleResponse = {
    properties: {
        alcanzado: {
            type: 'boolean',
        },
        beneficio_nombre: {
            type: 'string',
        },
        condicion_id: {
            type: 'string',
        },
        reinicia_contador: {
            type: 'boolean',
        },
        tipo_descuento: {
            type: 'string',
        },
        umbral_infusiones: {
            type: 'number',
        },
        valor_descuento: {
            type: 'number',
        },
        tipo_trigger: {
            type: 'string',
        },
        dias_semana: {
            type: 'array',
            contains: { type: 'number' },
        },
        scope_trigger: {
            type: 'string',
        },
        scope_trigger_categoria_id: {
            type: 'string',
            isNullable: true,
        },
        scope_trigger_producto_id: {
            type: 'string',
            isNullable: true,
        },
        scope_descuento: {
            type: 'string',
        },
        scope_descuento_categoria_id: {
            type: 'string',
            isNullable: true,
        },
    },
} as const;
