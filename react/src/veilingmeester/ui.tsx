import React, { useEffect, useMemo, useState } from "react"
import { apiGet } from "./data"

/* ===== helpers/formatters ===== */
const safeString = (v: unknown): string => {
    if (v == null) return ""
    if (typeof v === "string") return v
    if (typeof v === "number" || typeof v === "boolean") return String(v)
    if (v instanceof Date) return v.toISOString()
    try {
        const seen = new WeakSet<object>()
        return JSON.stringify(v, (_k, val) => {
            if (typeof val === "bigint") return val.toString()
            if (val && typeof val === "object") { if (seen.has(val)) return "[Circular]"; seen.add(val) }
            return val
        })
    } catch { try { return String(v) } catch { return "" } }
}

export const fmt = {
    text: (v: unknown) => safeString(v),
    number: (v: unknown, digits = 0) => (typeof v === "number" && Number.isFinite(v) ? v.toFixed(digits) : ""),
    dateIso: (v: unknown) => (v ? new Date(String(v)).toISOString() : ""),
    localDateTime: (iso?: string) => { if (!iso) return ""; const d = new Date(iso); return Number.isNaN(d.getTime()) ? "" : d.toLocaleString() },
    eur: (v: unknown) => (v == null || Number.isNaN(Number(v)) ? "" :
        new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(Number(v))),
}

/* ===== DataTable ===== */
export type Column<T extends Record<string, unknown>> = {
    key: keyof T & string
    header?: React.ReactNode
    render?: (value: unknown, row: T) => React.ReactNode
    width?: React.CSSProperties["width"]
    className?: string
    hideSm?: boolean
}
export type DataTableProps<T extends Record<string, unknown>> = {
    rows: ReadonlyArray<T>
    columns?: ReadonlyArray<Column<T>>
    maxColumns?: number
    onRowClick?: (row: T) => void
    getRowKey?: (row: T, index: number) => React.Key
    wrapperClassName?: string
    tableClassName?: string
    stickyHeader?: boolean
}

export function DataTable<T extends Record<string, unknown>>({
                                                                 rows, columns, maxColumns = 8, onRowClick, getRowKey,
                                                                 wrapperClassName = "table-responsive",
                                                                 tableClassName = "table table-sm table-striped table-hover align-middle",
                                                                 stickyHeader = true,
                                                             }: DataTableProps<T>) {
    if (!rows?.length) return <Empty />

    const cols: ReadonlyArray<Column<T>> = useMemo(() => {
        if (columns?.length) return columns
        const set = new Set<keyof T & string>()
        for (const r of rows) for (const k of Object.keys(r) as Array<keyof T & string>) set.add(k)
        return Array.from(set).sort().slice(0, maxColumns).map<Column<T>>((key) => ({ key }))
    }, [columns, rows, maxColumns])

    return (
        <div className={wrapperClassName}>
            <table className={tableClassName}>
                <thead className={stickyHeader ? "table-light sticky-top" : "table-light"} style={stickyHeader ? { top: 0, zIndex: 1 } : undefined}>
                <tr>
                    {cols.map((c) => (
                        <th key={c.key} className={`${c.className ?? ""} ${c.hideSm ? "d-none d-md-table-cell" : ""}`.trim()} style={c.width ? { width: c.width } : undefined}>
                            {c.header ?? c.key}
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {rows.map((row, i) => {
                    const key =
                        getRowKey?.(row, i) ??
                        ((row as any).id ?? (row as any).veilingProductNr ?? (row as any).veilingNr ?? (row as any).categorieNr ?? i)

                    const rowHandlers = onRowClick
                        ? {
                            onClick: () => onRowClick(row),
                            onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRowClick(row) } },
                            role: "button" as const,
                            tabIndex: 0,
                            style: { cursor: "pointer" },
                            "aria-label": "Selecteer rij",
                        }
                        : {}

                    return (
                        <tr key={key} {...rowHandlers}>
                            {cols.map((c) => {
                                const val = row[c.key]
                                const content = c.render ? c.render(val, row) : fmt.text(val)
                                const title = typeof val === "string" && val ? val : undefined
                                return (
                                    <td key={c.key} className={`${c.className ?? ""} ${c.hideSm ? "d-none d-md-table-cell" : ""}`.trim()} title={title}>
                                        {content}
                                    </td>
                                )
                            })}
                        </tr>
                    )
                })}
                </tbody>
            </table>
        </div>
    )
}

/* ===== Kleine UI bits ===== */
export const SpinnerInline = ({ text = "Laden…" }: { text?: string }) => (
    <span className="d-inline-flex align-items-center gap-2 text-muted" aria-live="polite" role="status">
    <span className="spinner-border spinner-border-sm" aria-hidden="true" />
    <span>{text}</span>
  </span>
)

export const Empty = ({ label = "Geen resultaten." }: { label?: string }) => (
    <div className="text-center text-muted py-5" role="status" aria-live="polite" aria-label="geen resultaten">
        <div className="display-6 mb-2">🌿</div>
        <p className="m-0">{label}</p>
    </div>
)

export type FilterChipProps = { children: React.ReactNode; onClear: () => void; title?: string }
export const FilterChip = ({ children, onClear, title }: FilterChipProps) => (
    <span className="badge rounded-pill bg-light text-body-secondary border d-inline-flex align-items-center gap-2" title={title}>
    <span className="ps-2">{children}</span>
    <button type="button" className="btn btn-sm btn-link text-body-secondary py-0 pe-2" onClick={onClear} aria-label="Verwijder filter">
      ×
    </button>
  </span>
)

/* ===== Modal: veilingen per product ===== */
type ApiVeiling = {
    veilingNr?: number
    begintijd?: string
    eindtijd?: string
    status?: string
    afbeelding?: string
    product?: { naam?: string; startprijs?: number; voorraad?: number }
}

export function VeilingModal({ productId, onClose }: { productId: number; onClose: () => void }) {
    const [lijst, setLijst] = useState<ApiVeiling[] | null>(null)
    const [sel, setSel] = useState<ApiVeiling | null>(null)

    useEffect(() => {
        setLijst(null); setSel(null)
        ;(async () => {
            try {
                const res = await apiGet<ApiVeiling[]>("/api/Veiling", { veilingProduct: productId, page: 1, pageSize: 100 })
                setLijst(res ?? [])
                setSel((res ?? [])[0] ?? null)
            } catch {
                setLijst([])
                setSel(null)
            }
        })()
    }, [productId])

    return (
        <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background: "rgba(0,0,0,.4)", zIndex: 1050 }} onClick={onClose}>
            <div className="card shadow-lg position-absolute top-50 start-50 translate-middle" style={{ maxWidth: 960, width: "96%" }} onClick={(e) => e.stopPropagation()}>
                <div className="card-header d-flex justify-content-between align-items-center">
                    <strong>Veilingen voor product #{productId}</strong>
                    <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Sluiten</button>
                </div>
                <div className="card-body">
                    {!lijst && (
                        <div className="placeholder-glow">
                            <div className="placeholder col-12 mb-2" />
                            <div className="placeholder col-10" />
                        </div>
                    )}

                    {lijst && lijst.length === 0 && <div className="alert alert-warning mb-0">Geen veilingen gevonden.</div>}

                    {lijst && lijst.length > 0 && (
                        <div className="row g-3">
                            <div className="col-md-6">
                                <h6 className="mb-2">Veilingen</h6>
                                <DataTable
                                    rows={lijst.map((v) => ({
                                        veilingNr: v.veilingNr ?? "",
                                        begintijd: fmt.localDateTime(v.begintijd),
                                        eindtijd: fmt.localDateTime(v.eindtijd),
                                        status: v.status ?? "",
                                        product: v.product?.naam ?? "",
                                    }))}
                                    onRowClick={(row) => setSel(lijst.find((v) => v.veilingNr === (row as any).veilingNr) ?? null)}
                                />
                            </div>

                            <div className="col-md-6">
                                <h6 className="mb-2">Details</h6>
                                {!sel && <div className="text-muted">Selecteer een veiling in de tabel.</div>}
                                {sel && (
                                    <div className="row g-3">
                                        {sel.afbeelding && (
                                            <div className="col-12">
                                                <img src={sel.afbeelding} alt={sel.product?.naam ?? "product"} className="img-fluid rounded" />
                                            </div>
                                        )}
                                        <div className="col-12">
                                            <h5 className="mb-1">{sel.product?.naam}</h5>
                                            <div className="text-muted mb-2">Veiling #{sel.veilingNr} • {sel.status ?? "Status onbekend"}</div>
                                            <dl className="row mb-0">
                                                <dt className="col-5 col-md-4">Startprijs</dt><dd className="col-7 col-md-8">{fmt.eur(sel.product?.startprijs)}</dd>
                                                <dt className="col-5 col-md-4">Voorraad</dt><dd className="col-7 col-md-8">{sel.product?.voorraad ?? ""}</dd>
                                                <dt className="col-5 col-md-4">Begintijd</dt><dd className="col-7 col-md-8">{fmt.localDateTime(sel.begintijd)}</dd>
                                                <dt className="col-5 col-md-4">Eindtijd</dt><dd className="col-7 col-md-8">{fmt.localDateTime(sel.eindtijd)}</dd>
                                            </dl>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

/* compat alias */
export { DataTable as ArrayTable }
