const currencyFormatter = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });

export const pad = (value: number): string => (value < 10 ? `0${value}` : String(value));

export const formatDateInput = (date: Date): string =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const formatTimeInput = (date: Date): string => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

export const formatDateTimeInput = (date: Date): string => `${formatDateInput(date)}T${formatTimeInput(date)}`;

export const buildDateTime = (dateValue: string, timeValue: string): Date | null => {
    if (!dateValue || !timeValue) return null;
    const [year, month, day] = dateValue.split("-").map(Number);
    const [hours, minutes] = timeValue.split(":").map(Number);
    if ([year, month, day, hours, minutes].some((value) => Number.isNaN(value))) return null;
    return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

export const getNextFullHour = (base = new Date()): Date => {
    const next = new Date(base);
    next.setMinutes(0, 0, 0);
    if (next <= base) {
        next.setHours(next.getHours() + 1);
    }
    return next;
};

const normaliseCurrency = (value: string): string => value.replace(",", ".").replace(/[^\d.]/g, "");

export const parseCurrencyValue = (value: string): number | null => {
    const parsed = Number.parseFloat(normaliseCurrency(value));
    return Number.isFinite(parsed) ? parsed : null;
};

export const formatDateParts = (date: Date): string => {
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

export const filterRows = <T, F>(
    rows: readonly T[],
    search: string,
    filters: F,
    predicate: (row: T, term: string, filters: F) => boolean,
): readonly T[] => {
    const term = (typeof search === "string" ? search : "").trim().toLowerCase();
    return rows.filter((row) => predicate(row, term, filters));
};