// General utilities for formatting and simple helpers.
const currencyFormatter = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });

const pad = (value: number): string => (value < 10 ? `0${value}` : String(value));
const formatDateParts = (date: Date): string => {
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${day}-${month}-${year} ${hours}:${minutes}`;
};

export const formatCurrency = (value?: number | null): string =>
    currencyFormatter.format(typeof value === "number" && Number.isFinite(value) ? value : 0);

export const formatDateTime = (value?: string | Date | null): string => {
    if (!value) return "—";
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : formatDateParts(date);
};

export const paginate = <T,>(rows: readonly T[], page: number, pageSize: number): readonly T[] => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
};

export const cx = (...classes: Array<string | false | null | undefined>): string => classes.filter(Boolean).join(" ");
