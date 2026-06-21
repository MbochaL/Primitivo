/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $dto_CategoriaMenuResponse = {
    properties: {
        id: {
            type: 'string',
        },
        nombre: {
            type: 'string',
        },
        productos: {
            type: 'array',
            contains: {
                type: 'dto_ProductoResponse',
            },
        },
        seccion: {
            type: 'string',
        },
    },
} as const;
