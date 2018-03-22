export interface Assertion {
    in: 'header' | 'body';
    field?: string;
    type: 'equals' | 'contains' | 'notEquals' | 'notContains' | 'gt' | 'lt' | 'gte' | 'lte' | 'present'
    expect: string
}