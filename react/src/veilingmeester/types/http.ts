export type QueryValue =
    | string
    | number
    | boolean
    | Date
    | readonly (string | number | boolean | Date)[]
    | undefined;

export type Query = Readonly<Record<string, QueryValue>>;
