export const toErrorMessage = (
    rawError: unknown,
    fallback: string,
): string | null => {
    if (!rawError) return null;
    if (typeof rawError === 'string') return rawError;
    if (rawError instanceof Error) return rawError.message;
    return fallback;
};
