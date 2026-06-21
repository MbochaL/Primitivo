/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $dto_ActualizarUsuarioRequest = {
    properties: {
        activo: {
            type: 'boolean',
            isRequired: true,
        },
        email: {
            type: 'string',
            isRequired: true,
        },
        rol: {
            type: 'Enum',
            isRequired: true,
        },
    },
} as const;
