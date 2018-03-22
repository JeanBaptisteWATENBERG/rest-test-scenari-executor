import {ParameterObject, RequestBodyObject} from 'openapi3-ts';

export interface Operation {
    path: string;
    method: string;
    operationId: string;
    summary: string;
    parameters?: ParameterObject[];
    requestBody?: RequestBodyObject;
}