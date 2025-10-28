import React from "react"

function safeStringify(value: unknown): string {
    const seen = new WeakSet<object>()
    try {
        return JSON.stringify(value, (_k, v) => {
            if (typeof v === "object" && v !== null) { if (seen.has(v)) return "[Circular]"; seen.add(v) }
            if (typeof v === "bigint") return v.toString()
            return v
        })
    } catch { try { return String(value) } catch { return "" } }
}
function formatCell(v: unknown): string {
    if (v == null) return ""
    if (typeof v === "string") return v
    if (typeof v === "number" || typeof v === "boolean") return String(v)
    return safeStringify(v)
}

export type ArrayTableProps<T extends Record<string, unknown>> = {
    rows: ReadonlyArray<T>
    maxColumns?: number
    onRowClick?: (row: T) => void   // <-- toegevoegd
}
export function ArrayTable<T extends Record<string, unknown>>({ rows, maxColumns = 10, onRowClick }: ArrayTableProps<T>) {
    if (!rows.length) return <div className="text-center text-muted py-5">Geen resultaten.</div>
    const colSet = new Set<keyof T & string>()
    for (const r of rows) for (const k of Object.keys(r) as Array<keyof T & string>) colSet.add(k)
    const cols = Array.from(colSet).sort().slice(0, maxColumns)

    return (
        <div className="table-responsive">
            <table className="table table-sm table-striped table-hover align-middle">
                <thead className="table-light sticky-top" style={{ top: 0, zIndex: 1 }}>
                <tr>{cols.map((c) => <th key={c} className="text-nowrap">{c}</th>)}</tr>
                </thead>
                <tbody>
                {rows.map((r, i) => (
                    <tr key={i}
                        onClick={onRowClick ? () => onRowClick(r) : undefined}
                        style={onRowClick ? { cursor: "pointer" } : undefined}
                        role={onRowClick ? "button" : undefined}>
                        {cols.map((c) => {
                            const val = r[c]
                            return <td key={c} title={typeof val === "string" ? val : undefined}>{formatCell(val)}</td>
                        })}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    )
}

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

export type FilterChipProps = { children: React.ReactNode; onClear: () => void }
export const FilterChip = ({ children, onClear }: FilterChipProps) => (
    <span className="badge rounded-pill bg-light text-body-secondary border d-inline-flex align-items-center gap-2">
    <span className="ps-2">{children}</span>
    <button type="button" className="btn btn-sm btn-link text-body-secondary py-0 pe-2" onClick={onClear} aria-label="Verwijder filter">×</button>
  </span>
)
