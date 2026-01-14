// Formatter voor euro’s in NL-notatie (bijv. € 1.234,56)
const currencyFormatter = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
});

/**
 * pad:
 * Zet een getal om naar 2 cijfers (bijv. 3 -> "03") voor datum/tijd formatting.
 */
export const pad = (value: number): string => (value < 10 ? `0${value}` : String(value));

/**
 * formatDateInput:
 * Maakt een datum-string voor input[type="date"] in formaat YYYY-MM-DD.
 */
export const formatDateInput = (date: Date): string =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/**
 * formatTimeInput:
 * Maakt een tijd-string voor input[type="time"] in formaat HH:mm.
 */
export const formatTimeInput = (date: Date): string => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

/**
 * formatDateTimeInput:
 * Maakt een datetime-string voor input[type="datetime-local"] in formaat YYYY-MM-DDTHH:mm.
 */
export const formatDateTimeInput = (date: Date): string => `${formatDateInput(date)}T${formatTimeInput(date)}`;

/**
 * buildDateTime:
 * Bouwt een Date object op basis van losse date/time input strings.
 * Geeft null terug bij ongeldige input.
 */
export const buildDateTime = (dateValue: string, timeValue: string): Date | null => {
    if (!dateValue || !timeValue) return null;

    const [year, month, day] = dateValue.split("-").map(Number);
    const [hours, minutes] = timeValue.split(":").map(Number);

    if ([year, month, day, hours, minutes].some((value) => Number.isNaN(value))) return null;

    return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

/**
 * getNextFullHour:
 * Geeft het eerstvolgende hele uur terug (minuten/seconden op 0).
 * Handig voor default starttijden in formulieren.
 */
export const getNextFullHour = (base = new Date()): Date => {
    const next = new Date(base);
    next.setMinutes(0, 0, 0);

    if (next <= base) {
        next.setHours(next.getHours() + 1);
    }

    return next;
};

/**
 * normaliseCurrency:
 * Normaliseert een bedrag-string naar iets dat parseFloat snapt:
 * - komma -> punt
 * - verwijdert tekens behalve cijfers en punt
 */
const normaliseCurrency = (value: string): string =>
    value.replace(",", ".").replace(/[^\d.]/g, "");

/**
 * parseCurrencyValue:
 * Probeert een bedrag-string om te zetten naar een nummer.
 * Geeft null terug als het geen geldig getal is.
 */
export const parseCurrencyValue = (value: string): number | null => {
    const parsed = Number.parseFloat(normaliseCurrency(value));
    return Number.isFinite(parsed) ? parsed : null;
};

/**
 * formatDateParts:
 * Zet een Date om naar een leesbaar NL-formaat: DD-MM-YYYY HH:mm.
 */
export const formatDateParts = (date: Date): string => {
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${day}-${month}-${year} ${hours}:${minutes}`;
};

/**
 * formatCurrency:
 * Formatteert een bedrag naar euro’s.
 * Fallback naar €0,00 bij null/undefined/ongeldig.
 */
export const formatCurrency = (value?: number | null): string =>
    currencyFormatter.format(typeof value === "number" && Number.isFinite(value) ? value : 0);

/**
 * formatDateTime:
 * Formatteert een Date of ISO-string naar DD-MM-YYYY HH:mm.
 * Geeft "—" terug bij null/ongeldige datum.
 */
export const formatDateTime = (value?: string | Date | null): string => {
    if (!value) return "—";

    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : formatDateParts(date);
};

/**
 * paginate:
 * Geeft een slice van de lijst terug op basis van page en pageSize (1-based pages).
 */
export const paginate = <T,>(rows: readonly T[], page: number, pageSize: number): readonly T[] => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
};

/**
 * filterRows:
 * Algemene helper voor zoeken + filters.
 * - normaliseert de zoekterm (trim + lowercase)
 * - laat predicate bepalen of een rij matcht
 */
export const filterRows = <T, F>(
    rows: readonly T[],
    search: string,
    filters: F,
    predicate: (row: T, term: string, filters: F) => boolean,
): readonly T[] => {
    const term = (typeof search === "string" ? search : "").trim().toLowerCase();
    return rows.filter((row) => predicate(row, term, filters));
};
