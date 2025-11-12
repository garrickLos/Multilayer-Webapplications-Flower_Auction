const currencyFormatter = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
const dateTimeFormatter = new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" });

export function formatCurrency(value: number | null | undefined): string {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return currencyFormatter.format(0);
    }
    return currencyFormatter.format(value);
}

export function formatDateTime(value: string | Date | null | undefined): string {
    if (!value) return "—";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return dateTimeFormatter.format(date);
}

export function parseIsoDate(value: string | null | undefined): number | undefined {
    if (!value) return undefined;
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : undefined;
}
