/**
 * Displays the aantal resultaten for a table.
 *
 * @param props - Contains count en optioneel totaal.
 */
export function ResultBadge({ count, total }: { readonly count: number; readonly total?: number }): JSX.Element {
    const base = count === 1 ? "1 resultaat" : `${count} resultaten`;
    const suffix = total != null ? ` • van ${total} totaal` : "";
    return (
        <span className="badge bg-success-subtle text-success-emphasis rounded-pill shadow-sm" aria-live="polite">
            {base}
            {suffix}
        </span>
    );
}
