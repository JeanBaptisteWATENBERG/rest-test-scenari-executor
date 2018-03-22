import {ScenarioItem} from './ScenarioItem';

export interface ScenarioDescription {
    name: string;
    description?: string;
    author: string;
    tenantId: string;
    scenario: ScenarioItem[];
}