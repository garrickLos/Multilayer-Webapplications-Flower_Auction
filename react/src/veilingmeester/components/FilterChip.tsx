/**
 * Removable badge used to summarise actieve filters.
 *
 * @param props - Chip label en verwijderactie.
 */
export function FilterChip({ label, onRemove }: { readonly label: string; readonly onRemove: () => void }): JSX.Element {
    return (
        <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle rounded-pill d-inline-flex align-items-center gap-2 px-2 py-1">
            <span>{label}</span>
            <button type="button" className="btn-close btn-close-sm" aria-label={`${label} verwijderen`} onClick={onRemove} />
        </span>
    );
}
