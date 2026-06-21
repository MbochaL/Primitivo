/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $dto_RegistrarCompraRequest = {
    properties: {
        cliente_id: {
            type: 'string',
            isRequired: true,
        },
        condicion_id: {
            type: 'string',
        },
        items: {
            type: 'array',
            contains: {
                type: 'dto_ItemCompraRequest',
            },
            isRequired: true,
        },
    },
} as const;
