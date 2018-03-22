export interface Extraction {
    in: 'header' | 'body';
    field: string;
    as: string;
}