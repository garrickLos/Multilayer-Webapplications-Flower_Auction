import type { StatusLabel } from "../types";

export const cx = (...classes: Array<string | false | null | undefined>): string => classes.filter(Boolean).join(" ");

export const formatCurrency = (value?: number | null): string =>
    new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(
        typeof value === "number" && Number.isFinite(value) ? value : 0,
    );

export const formatDateTime = (value?: string | null): string => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("nl-NL");
};

export const formatDate = (value?: string | null): string => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toISOString().slice(0, 10);
};

export const toDateInputValue = (value?: string | null): string => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

export const toDateTimeLocalValue = (value?: string | null): string => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 16);
};

export const paginate = <T,>(rows: readonly T[], page: number, pageSize: number): readonly T[] => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
};

export const normaliseStatus = (status?: string): StatusLabel => {
    const normalised = (status ?? "").toLowerCase();
    if (normalised === "active" || normalised === "actief") return "active";
    if (normalised === "sold" || normalised === "verkocht") return "sold";
    if (normalised === "inactive" || normalised === "geannuleerd") return "inactive";
    return "unknown";
};
