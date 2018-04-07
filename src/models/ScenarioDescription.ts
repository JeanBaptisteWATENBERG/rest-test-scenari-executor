import {ScenarioItem} from './ScenarioItem';

export interface IScenarioDescription {
    name: string;
    description?: string;
    author: string;
    tenantId: string;
    scenario: ScenarioItem[];
}
