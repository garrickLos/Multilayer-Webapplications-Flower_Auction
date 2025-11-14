const currencyFormatter = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
});

const dateTimeFormatter = new Intl.DateTimeFormat("nl-NL", {
    dateStyle: "medium",
    timeStyle: "short",
});

export function formatCurrency(value?: number | null): string {
    return currencyFormatter.format(
        typeof value === "number" && Number.isFinite(value) ? value : 0,
    );
}

export function formatDateTime(value?: string | Date | null): string {
    if (!value) return "—";
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date);
}

export function parseIsoDate(value?: string | null): number | undefined {
    const ms = value ? Date.parse(value) : NaN;
    return Number.isFinite(ms) ? ms : undefined;
}

export function cx(...classes: Array<string | null | false | undefined>): string {
    return classes.filter((c): c is string => Boolean(c)).join(" ");
}
