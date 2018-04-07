export interface IExtraction {
    in: 'header' | 'body';
    field: string;
    as: string;
}
