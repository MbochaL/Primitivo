/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { dto_BeneficioInstitucionResponse } from './dto_BeneficioInstitucionResponse';
import type { dto_CondicionResponse } from './dto_CondicionResponse';
export type dto_BeneficioAdminResponse = {
    activo?: boolean;
    condiciones?: Array<dto_CondicionResponse>;
    id?: string;
    instituciones?: Array<dto_BeneficioInstitucionResponse>;
    nombre?: string;
};
