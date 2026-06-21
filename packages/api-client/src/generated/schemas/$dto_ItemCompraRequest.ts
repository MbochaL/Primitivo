/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $dto_ItemCompraRequest = {
    properties: {
        cantidad: {
            type: 'number',
            isRequired: true,
            minimum: 1,
        },
        producto_id: {
            type: 'string',
            isRequired: true,
        },
    },
} as const;
