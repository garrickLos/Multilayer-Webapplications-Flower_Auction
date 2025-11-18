// General utilities for formatting and simple helpers.
const currencyFormatter = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
const dateFormatter = new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" });

export const formatCurrency = (value?: number | null): string =>
    currencyFormatter.format(typeof value === "number" && Number.isFinite(value) ? value : 0);

export const formatDateTime = (value?: string | Date | null): string => {
    if (!value) return "—";
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
};

export const paginate = <T,>(rows: readonly T[], page: number, pageSize: number): readonly T[] => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
};

export const cx = (...classes: Array<string | false | null | undefined>): string => classes.filter(Boolean).join(" ");
