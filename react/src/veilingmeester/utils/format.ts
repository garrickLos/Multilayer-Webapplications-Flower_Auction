const dateFormatter = new Intl.DateTimeFormat('nl-NL', {
    dateStyle: 'short',
    timeStyle: 'short',
});

const currencyFormatter = new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
});

export const formatDateTime = (value?: string | Date | null): string => {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return dateFormatter.format(date);
};

const normalizeCurrencyInput = (value: number | string) =>
    typeof value === 'string'
        ? value.replace(/\./g, '').replace(',', '.')
        : value;

export const formatCurrency = (
    value?: number | string | null,
    options?: { currency?: string },
): string => {
    if (value == null || value === '') return '';
    const raw = normalizeCurrencyInput(value);
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return '';

    if (options?.currency && options.currency !== 'EUR') {
        return new Intl.NumberFormat('nl-NL', {
            style: 'currency',
            currency: options.currency,
        }).format(parsed);
    }

    return currencyFormatter.format(parsed);
};

export const parseLocaleNumber = (
    value: number | string | null | undefined,
): number => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string') {
        const normalized = normalizeCurrencyInput(value);
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
};
