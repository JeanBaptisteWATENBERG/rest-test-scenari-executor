import { IAssertion } from './Assertion';
import { IExtraction } from './Extraction';
import { IOperation } from './Operation';
import { Variable } from './Variable';

export type ScenarioItem = IBasicAuthenticationScenarioItem | IPathScenarioItem;

export interface IAuthenticationScenarioItem {
    authenticationType: string;
}

export interface IBasicAuthenticationScenarioItem extends IAuthenticationScenarioItem {
    type: 'authentication';
    authenticationType: 'basic';
    username?: string | Variable;
    password?: string | Variable;
}

export interface IPathScenarioItem {
    type: 'path';
    url: string;
    operation: IOperation;
    contentType?: string;
    accept: string;
    asserts: IAssertion[];
    extracts?: IExtraction[];
}
