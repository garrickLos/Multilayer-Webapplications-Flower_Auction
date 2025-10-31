import React, { memo, useEffect, useId, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { apiGet } from "./data";

/**
 * Ultra‑lean, Bootstrap‑first rewrite (single source of truth for search + results)
 * — The ONLY search bar and results badge live inside DataTable
 * — VeilingModal passes raw rows; no extra filtering or badges there
 */

/* ===================== small helpers (SSR‑safe) ===================== */
const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
const cls = (...a: Array<string | false | null | undefined>) => a.filter(Boolean).join(" ");

const safeString = (v: unknown): string => {
    if (v == null) return "";
    const t = typeof v;
    if (t === "string" || t === "number" || t === "boolean" || t === "bigint") return String(v);
    if (v instanceof Date) return v.toISOString();
    try { return JSON.stringify(v as any); } catch { return ""; }
};

const EUR = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
const DTF = new Intl.DateTimeFormat("nl-NL", { dateStyle: "short", timeStyle: "short" });
const COLL = new Intl.Collator("nl-NL", { numeric: true, sensitivity: "base" });

export const fmt = {
    text: (v: unknown) => safeString(v),
    eur: (v: unknown) => (v == null || Number.isNaN(Number(v)) ? "" : EUR.format(Number(v))),
    localDateTime: (v?: string | Date | null) => {
        const d = typeof v === "string" ? new Date(v) : v ?? null;
        return d && !Number.isNaN(d.getTime()) ? DTF.format(d) : "";
    },
};

/* ============================ DataTable ============================ */
export type Column<T extends Record<string, unknown>> = {
    key: keyof T & string;
    header?: React.ReactNode;
    render?: (value: T[keyof T], row: T) => React.ReactNode;
    className?: string;
    width?: React.CSSProperties["width"];
    sortable?: boolean;
    hideSm?: boolean;
};

export type DataTableProps<T extends Record<string, unknown>> = {
    rows: ReadonlyArray<T>;
    columns?: ReadonlyArray<Column<T>>;
    maxColumns?: number;
    caption?: string;
    onRowClick?: (row: T) => void;
    getRowKey?: (row: T, i: number) => React.Key;
    stickyHeader?: boolean;
    emptyLabel?: string;
    defaultSortKey?: keyof T & string;
    defaultSortDir?: "asc" | "desc";
    wrapperClassName?: string;
    tableClassName?: string;
    /** optional list of keys to search; defaults to visible columns */
    filterKeys?: ReadonlyArray<keyof T & string>;
    /** placeholder text for the built-in filter */
    filterPlaceholder?: string;
};

const autoCols = <T extends Record<string, unknown>>(rows: ReadonlyArray<T>, max = 8) => {
    const keys = new Set<string>();
    for (let i = 0; i < rows.length; i++) for (const k of Object.keys(rows[i])) keys.add(k);
    return Array.from(keys).sort().slice(0, max).map(key => ({ key: key as keyof T & string, sortable: true }));
};

const autoKey = (row: Record<string, unknown>, i: number) => (row.id ?? (row as any).veilingProductNr ?? (row as any).veilingNr ?? (row as any).categorieNr ?? i) as React.Key;

export function DataTableInner<T extends Record<string, unknown>>({
                                                                      rows,
                                                                      columns,
                                                                      maxColumns = 8,
                                                                      caption,
                                                                      onRowClick,
                                                                      getRowKey,
                                                                      stickyHeader = true,
                                                                      emptyLabel = "Geen resultaten.",
                                                                      defaultSortKey,
                                                                      defaultSortDir = "asc",
                                                                      wrapperClassName = "table-responsive rounded-3 border bg-body",
                                                                      tableClassName = "table table-sm table-striped table-hover align-middle caption-top",
                                                                      filterKeys,
                                                                      filterPlaceholder = "zoeken…",
                                                                  }: DataTableProps<T>) {
    if (!rows?.length) return <Empty label={emptyLabel} />;

    const cols = useMemo(() => (columns?.length ? columns : autoCols(rows, maxColumns)), [columns, rows, maxColumns]);
    const [sortKey, setSortKey] = useState<string | undefined>(defaultSortKey);
    const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultSortDir);
    const [q, setQ] = useState("");

    const keysToSearch = useMemo(() => (filterKeys?.length ? filterKeys : cols.map(c => c.key)), [filterKeys, cols]);

    const filtered = useMemo(() => {
        const t = q.trim().toLowerCase();
        if (!t) return rows;
        return rows.filter(r => keysToSearch.some(k => String((r as any)[k] ?? "").toLowerCase().includes(t)));
    }, [rows, q, keysToSearch]);

    const sorted = useMemo(() => {
        const base = filtered;
        if (!sortKey) return base;
        const copy = base.slice();
        copy.sort((a, b) => {
            const av = (a as any)[sortKey];
            const bv = (b as any)[sortKey];
            if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
            const cmp = COLL.compare(safeString(av), safeString(bv));
            return sortDir === "asc" ? cmp : -cmp;
        });
        return copy;
    }, [filtered, sortKey, sortDir]);

    const tableId = useId();

    const toggleSort = useCallback((key: string | undefined) => {
        if (!key) return;
        setSortKey(key);
        setSortDir(prev => (sortKey === key ? (prev === "asc" ? "desc" : "asc") : "asc"));
    }, [sortKey]);

    return (
        <section className="p-2" aria-label="tabel">
            <div className="card shadow-sm border-0 border border-success-subtle">
                {caption && (
                    <div className="card-header bg-success-subtle border-0 py-2">
                        <div id={`${tableId}-caption`} className="small text-success">{caption}</div>
                    </div>
                )}
                <div className="card-body pt-2">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="badge bg-success-subtle text-success">{sorted.length.toLocaleString("nl-NL")} resultaten</span>
                        <div className="input-group input-group-sm" style={{ maxWidth: 320 }}>
                            <span className="input-group-text bg-success-subtle text-success border-success-subtle">Zoek</span>
                            <input className="form-control" value={q} onChange={(e)=>setQ(e.target.value)} placeholder={filterPlaceholder} aria-label="Filter resultaten" />
                            {!!q && <button className="btn btn-outline-secondary" onClick={()=>setQ("")}>Wissen</button>}
                        </div>
                    </div>

                    <div className={wrapperClassName}>
                        <table className={tableClassName} aria-describedby={caption ? `${tableId}-caption` : undefined}>
                            <thead className={cls(stickyHeader && "position-sticky top-0", "bg-success-subtle")} style={stickyHeader ? { zIndex: 1 } : undefined}>
                            <tr>
                                {cols.map(c => {
                                    const active = sortKey === c.key;
                                    const ariaSort = active ? (sortDir === "asc" ? "ascending" : "descending") : "none";
                                    const thClass = cls("text-nowrap text-success", c.className, c.hideSm && "d-none d-md-table-cell", c.sortable && "user-select-none");
                                    return (
                                        <th
                                            key={c.key}
                                            scope="col"
                                            aria-sort={ariaSort as any}
                                            className={thClass}
                                            style={c.width != null ? ({ width: c.width } as const) : undefined}
                                            title={c.sortable ? "Klik om te sorteren" : undefined}
                                        >
                                            {c.sortable ? (
                                                <button
                                                    type="button"
                                                    className="btn btn-link p-0 text-success text-decoration-none d-inline-flex align-items-center gap-1"
                                                    onClick={() => toggleSort(c.key)}
                                                    aria-label={`Sorteer op ${String(c.header ?? c.key)}`}
                                                >
                                                    {c.header ?? c.key}
                                                    {active && <span className="small">{sortDir === "asc" ? "▲" : "▼"}</span>}
                                                </button>
                                            ) : (
                                                <span className="d-inline-flex align-items-center gap-1">{c.header ?? c.key}</span>
                                            )}
                                        </th>
                                    );
                                })}
                            </tr>
                            </thead>
                            <tbody>
                            {sorted.map((row, i) => (
                                <tr
                                    key={getRowKey?.(row, i) ?? autoKey(row, i)}
                                    onClick={() => onRowClick?.(row)}
                                    tabIndex={onRowClick ? 0 : -1}
                                    role={onRowClick ? "button" : undefined}
                                    onKeyDown={(e) => { if (onRowClick && (e.key === "Enter" || e.key === " ")) onRowClick(row); }}
                                >
                                    {cols.map(c => {
                                        const val = row[c.key] as T[keyof T];
                                        const content = c.render ? c.render(val, row) : fmt.text(val);
                                        return (
                                            <td key={c.key} className={cls("text-truncate", c.className, c.hideSm && "d-none d-md-table-cell")} style={{ maxWidth: 0 }}>{content}</td>
                                        );
                                    })}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
}

export const DataTable = memo(DataTableInner) as typeof DataTableInner;

/* ============================== small UI bits ============================== */
export const SpinnerInline = ({ text = "Laden…" }: { text?: string }) => (
    <span className="d-inline-flex align-items-center gap-2 text-muted" aria-live="polite" role="status">
    <span className="spinner-border spinner-border-sm" aria-hidden="true" /><span>{text}</span>
  </span>
);

export const Empty = ({ label = "Geen resultaten." }: { label?: string }) => (
    <div className="text-center text-muted py-5" role="status" aria-live="polite" aria-label="geen resultaten">
        <div className="display-6 mb-2">🌿</div><p className="m-0">{label}</p>
    </div>
);

export const FilterChip = ({ children, onClear, title }: { children: React.ReactNode; onClear: () => void; title?: string; }) => (
    <span className="badge rounded-pill bg-success-subtle text-success border d-inline-flex align-items-center gap-2 border-success-subtle" title={title}>
    <span className="ps-2 text-truncate" style={{ maxWidth: 240 }}>{children}</span>
    <button type="button" className="btn btn-sm btn-link text-success py-0 pe-2" onClick={onClear} aria-label="Verwijder filter">×</button>
  </span>
);

/* ================================== Modal ================================== */

type ModalProps = {
    title: React.ReactNode;
    onClose: () => void;
    children: React.ReactNode;
    size?: "sm" | "lg" | "xl";
    fullscreenUntil?: "sm" | "md" | "lg" | "xl" | "xxl";
    maxWidthPx?: number;
};

export const Modal: React.FC<ModalProps> = ({ title, onClose, children, size, fullscreenUntil, maxWidthPx }) => {
    const portalRoot = isBrowser ? document.body : null;
    const titleId = `${useId()}-title`;

    useEffect(() => {
        if (!isBrowser) return;
        const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onEsc);
        return () => window.removeEventListener("keydown", onEsc);
    }, [onClose]);

    const fsClass = fullscreenUntil ? `modal-fullscreen-${fullscreenUntil}-down` : "modal-fullscreen-sm-down";
    const dialogCls = cls("modal-dialog modal-dialog-centered modal-dialog-scrollable", fsClass, size === "sm" && "modal-sm", size === "lg" && "modal-lg", size === "xl" && "modal-xl");
    const dialogStyle = fullscreenUntil ? undefined : (maxWidthPx ? ({ maxWidth: `min(98vw, ${maxWidthPx}px)` } as const) : undefined);

    const modalNode = (
        <div className="modal show d-block" style={{ zIndex: 1055 }} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <div className={dialogCls} role="document" style={dialogStyle}>
                <div className="modal-content shadow border-0">
                    <div className="modal-header bg-success-subtle">
                        <h5 id={titleId} className="modal-title m-0 text-success">{title}</h5>
                        <button type="button" className="btn-close" aria-label="Sluiten" onClick={onClose} />
                    </div>
                    <div className="modal-body p-3">{children}</div>
                </div>
            </div>
        </div>
    );

    const backdropNode = (
        <div className="modal-backdrop show" style={{ zIndex: 1050 }} aria-hidden="true" onMouseDown={onClose} />
    );

    return portalRoot ? (<>
        {createPortal(backdropNode, portalRoot)}
        {createPortal(modalNode, portalRoot)}
    </>) : modalNode;
};

/* ============================= VeilingModal ============================= */

type ApiVeiling = {
    veilingNr?: number; begintijd?: string; eindtijd?: string; status?: string; afbeelding?: string;
    product?: { naam?: string; startprijs?: number; voorraad?: number };
};

type VeilingRow = { veilingNr: number | ""; begintijd: string; eindtijd: string; status: string; product: string };

const StatusBadge = ({ status }: { status?: string | null }) => {
    if (!status) return null;
    const s = status.toLowerCase();
    const clsName = s.includes("actief") ? "bg-success-subtle text-success" : s.includes("afgesloten") ? "bg-secondary-subtle text-secondary" : s.includes("gepland") ? "bg-info-subtle text-info" : "bg-light text-body";
    return <span className={cls("badge", clsName)}>{status}</span>;
};

export function VeilingModal({ productId, onClose }: { productId: number; onClose: () => void }) {
    const [rowsRaw, setRowsRaw] = useState<ApiVeiling[] | null>(null);
    const [sel, setSel] = useState<ApiVeiling | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const ctl = new AbortController();
        setRowsRaw(null); setSel(null); setError(null);
        (async () => {
            try {
                const res = await apiGet<ApiVeiling[]>("/api/Veiling", { veilingProduct: productId, page: 1, pageSize: 100, signal: ctl.signal } as any);
                if (ctl.signal.aborted) return;
                const rows = res ?? []; setRowsRaw(rows); setSel(rows[0] ?? null);
            } catch {
                if (!ctl.signal.aborted) { setRowsRaw([]); setSel(null); setError("Kon veilingen niet ophalen."); }
            }
        })();
        return () => ctl.abort();
    }, [productId]);

    const columns = useMemo<ReadonlyArray<Column<VeilingRow>>>(() => [
        { key: "veilingNr", header: "#", width: 96, className: "text-nowrap", sortable: true },
        { key: "begintijd", header: "Begintijd", className: "text-nowrap", sortable: true },
        { key: "eindtijd", header: "Eindtijd", className: "text-nowrap", sortable: true, hideSm: true },
        { key: "status", header: "Status", className: "text-nowrap", sortable: true, hideSm: true },
        { key: "product", header: "Product", className: "text-nowrap", sortable: true },
    ], []);

    const rows: VeilingRow[] = useMemo(() => (rowsRaw ?? []).map(v => ({
        veilingNr: v.veilingNr ?? "",
        begintijd: fmt.localDateTime(v.begintijd),
        eindtijd: fmt.localDateTime(v.eindtijd),
        status: v.status ?? "",
        product: v.product?.naam ?? "",
    })), [rowsRaw]);

    return (
        <Modal title={<span>Veilingen <span className="text-muted">#{productId}</span></span>} onClose={onClose} size="xl" fullscreenUntil="lg" maxWidthPx={1400}>
            {!rowsRaw && !error && (
                <div className="placeholder-glow" aria-live="polite" aria-busy="true">
                    <div className="placeholder col-12 mb-2" /><div className="placeholder col-10" />
                </div>
            )}
            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            {rowsRaw && (
                <div className="row g-3">
                    <div className="col-lg-8 col-md-7">
                        <DataTable<VeilingRow>
                            rows={rows}
                            columns={columns}
                            caption="Klik een rij voor details"
                            onRowClick={(r) => setSel(rowsRaw?.find(v => (v.veilingNr ?? "") === r.veilingNr) ?? null)}
                            emptyLabel="Geen veilingen."
                            defaultSortKey="begintijd"
                            defaultSortDir="asc"
                        />
                    </div>

                    <div className="col-lg-4 col-md-5">
                        <article className="card shadow-sm border-0 border border-success-subtle">
                            {sel?.afbeelding && (
                                <div className="ratio ratio-16x9">
                                    <img src={sel.afbeelding} alt={sel.product?.naam || "product"} className="w-100 h-100 object-fit-cover rounded-top" loading="lazy" decoding="async" fetchpriority="low" sizes="(max-width: 768px) 100vw, 50vw" />
                                </div>
                            )}
                            <div className="card-body">
                                <h5 className="card-title d-flex align-items-center gap-2 mb-1 text-success">
                                    {sel?.product?.naam || <span className="text-muted">Geen naam</span>}
                                    <StatusBadge status={sel?.status} />
                                </h5>
                                <div className="text-muted mb-3">{sel ? <>Veiling #{sel.veilingNr}</> : "Selecteer een veiling in de tabel."}</div>

                                {sel && (
                                    <ul className="list-group list-group-flush">
                                        <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                                            <span className="text-muted">Startprijs</span><strong>{fmt.eur(sel.product?.startprijs)}</strong>
                                        </li>
                                        <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                                            <span className="text-muted">Voorraad</span><span>{sel.product?.voorraad ?? ""}</span>
                                        </li>
                                        <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                                            <span className="text-muted">Begintijd</span><span>{fmt.localDateTime(sel.begintijd)}</span>
                                        </li>
                                        <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                                            <span className="text-muted">Eindtijd</span><span>{fmt.localDateTime(sel.eindtijd)}</span>
                                        </li>
                                    </ul>
                                )}
                            </div>
                        </article>
                    </div>
                </div>
            )}
        </Modal>
    );
}

// Back‑compat alias
export { DataTable as ArrayTable };
