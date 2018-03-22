import { Variable } from './Variable';
import { Assertion } from './Assertion';
import { Extraction } from './Extraction';
import { Operation } from './Operation';

export type ScenarioItem = BasicAuthenticationScenarioItem | PathScenarioItem;

export interface AuthenticationScenarioItem {
    authenticationType: string;
}

export interface BasicAuthenticationScenarioItem extends AuthenticationScenarioItem {
    type: 'authentication';
    authenticationType: 'basic';
    username?: string | Variable;
    password?: string | Variable;
}

export interface PathScenarioItem {
    type: 'path';
    url: string;
    operation: Operation;
    contentType?: string;
    accept: string;
    asserts: Assertion[];
    extracts?: Extraction[];
}