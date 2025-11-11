export const splitSearchTokens = (query: string): string[] =>
    query
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);

export const normalizeForSearch = (value: string): string =>
    (value || '')
        .normalize('NFKD')
        .replace(/\p{M}/gu, '')
        .replace(/\p{Cc}+/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

export function rowToSearchString(
    row: Record<string, unknown>,
    maxNodes = 5_000,
    maxLen = 100_000,
): string {
    const out: string[] = [];
    const stack: unknown[] = [row];
    const seen = new WeakSet<object>();
    let nodes = 0;

    while (stack.length && nodes < maxNodes) {
        const value = stack.pop();
        if (value == null) {
            nodes++;
            continue;
        }

        const type = typeof value;

        if (
            type === 'string' ||
            type === 'number' ||
            type === 'boolean' ||
            type === 'bigint'
        ) {
            out.push(String(value));
        } else if (value instanceof Date && !Number.isNaN(value.getTime())) {
            out.push(value.toISOString());
        } else if (Array.isArray(value)) {
            stack.push(...value);
        } else if (type === 'object' && !seen.has(value as object)) {
            seen.add(value as object);
            stack.push(...Object.values(value as Record<string, unknown>));
        }

        nodes++;
    }

    const result = normalizeForSearch(out.join(' '));
    return result.length > maxLen ? result.slice(0, maxLen) : result;
}

export const matchesSearchTokens = (
    searchValue: string,
    tokens: readonly string[],
): boolean => tokens.every(token => searchValue.includes(token));
