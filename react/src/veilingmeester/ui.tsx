import React from "react"

/** ===== Fallback table cell formatter ===== */
function formatCell(v: unknown) {
    if (v == null) return ""
    if (typeof v === "string") return v
    if (typeof v === "number" || typeof v === "boolean") return String(v)
    try { return JSON.stringify(v) } catch { return String(v) }
}

/** ===== Generic array -> table renderer ===== */
export function renderArrayAsTable(rows: Record<string, unknown>[]) {
    if (!rows.length) return <div className="text-center text-muted py-5">Geen resultaten.</div>
    const cols = Array.from(
        rows.reduce<Set<string>>((acc, r) => {
            Object.keys(r).forEach((k) => acc.add(k))
            return acc
        }, new Set())
    ).slice(0, 10)

    return (
        <div className="table-responsive">
            <table className="table table-sm table-striped table-hover align-middle">
                <thead className="table-light sticky-top" style={{ top: 0, zIndex: 1 }}>
                <tr>{cols.map((c) => <th key={c} className="text-nowrap">{c}</th>)}</tr>
                </thead>
                <tbody>
                {rows.map((r, i) => (
                    <tr key={i}>
                        {cols.map((c) => (<td key={c}>{formatCell((r as any)[c])}</td>))}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    )
}

/** ===== Small UI bits ===== */
export const SpinnerInline = ({ text = "Laden…" }: { text?: string }) => (
    <span className="d-inline-flex align-items-center gap-2 text-muted" aria-live="polite">
    <span className="spinner-border spinner-border-sm" role="status" aria-label="laden" />
    <span>{text}</span>
  </span>
)

export const Empty = ({ label = "Geen resultaten." }: { label?: string }) => (
    <div className="text-center text-muted py-5" role="status" aria-live="polite">
        <div className="display-6 mb-2">🌿</div>
        <p className="m-0">{label}</p>
    </div>
)

export const FilterChip = ({
                               children,
                               onClear,
                           }: {
    children: React.ReactNode
    onClear: () => void
}) => (
    <span className="badge rounded-pill bg-light text-body-secondary border d-inline-flex align-items-center gap-2">
    <span className="ps-2">{children}</span>
    <button
        className="btn btn-sm btn-link text-body-secondary py-0 pe-2"
        onClick={onClear}
        aria-label="Verwijder filter"
    >
      ×
    </button>
  </span>
)
