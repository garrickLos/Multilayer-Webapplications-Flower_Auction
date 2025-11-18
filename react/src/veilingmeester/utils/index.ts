const currencyFormatter = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
const dateTimeFormatter = new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" });

export const formatCurrency = (value?: number | null): string =>
    currencyFormatter.format(typeof value === "number" && Number.isFinite(value) ? value : 0);

export const formatDateTime = (value?: string | Date | null): string => {
    if (!value) return "—";
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date);
};

export const parseIsoDate = (value?: string | null): number | undefined => {
    const ms = value ? Date.parse(value) : NaN;
    return Number.isFinite(ms) ? ms : undefined;
};

export const cx = (...classes: Array<string | null | false | undefined>): string =>
    classes.filter(Boolean).join(" ");
