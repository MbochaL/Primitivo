/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $dto_CrearUsuarioRequest = {
    properties: {
        email: {
            type: 'string',
            isRequired: true,
        },
        password: {
            type: 'string',
            isRequired: true,
            minLength: 8,
        },
        rol: {
            type: 'Enum',
            isRequired: true,
        },
    },
} as const;
