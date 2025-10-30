import React, {
    memo, useEffect, useLayoutEffect, useMemo, useRef, useState, useId, useCallback,
} from "react";
import { createPortal } from "react-dom";
import { apiGet } from "./data";

/* ============== env & tiny helpers ============== */
const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
const useIsoLE = isBrowser ? useLayoutEffect : useEffect;

// tiny cx (strings|numbers|arrays|objects) without temp arrays
type CxArg = string | number | null | false | undefined | CxArg[] | Record<string, boolean>;
export const cx = (...a: CxArg[]) => {
    let out = "";
    const put = (s: string) => (out += (out && " ") + s);
    const push = (v: CxArg): void => {
        if (!v) return;
        if (typeof v === "string" || typeof v === "number") return put(String(v));
        if (Array.isArray(v)) for (let i = 0; i < v.length; i++) push(v[i]);
        else for (const k in v) (v as Record<string, boolean>)[k] && put(k);
    };
    for (let i = 0; i < a.length; i++) push(a[i]);
    return out;
};

const safeString = (v: unknown): string => {
    if (v == null) return "";
    const t = typeof v;
    if (t === "string" || t === "number" || t === "boolean" || t === "bigint") return String(v);
    if (v instanceof Date) return v.toISOString();
    try {
        const seen = new WeakSet<object>();
        return JSON.stringify(v as unknown, (_k, val) => {
            if (typeof val === "bigint") return String(val);
            if (val && typeof val === "object") { if (seen.has(val)) return "[Circular]"; seen.add(val); }
            return val;
        });
    } catch { try { return String(v as unknown); } catch { return ""; } }
};

// Intl caches
const nfCache = new Map<number, Intl.NumberFormat>();
const getNF = (d = 0) => nfCache.get(d) ?? (nfCache.set(d, new Intl.NumberFormat("nl-NL",{minimumFractionDigits:d,maximumFractionDigits:d})), nfCache.get(d)!);
const EUR = new Intl.NumberFormat("nl-NL",{style:"currency",currency:"EUR"});
const DTF = new Intl.DateTimeFormat("nl-NL",{dateStyle:"short",timeStyle:"short"});

export const fmt = {
    text: (v: unknown) => safeString(v),
    number: (v: unknown, d = 0) => (typeof v === "number" && Number.isFinite(v) ? getNF(d).format(v) : ""),
    dateIso: (v: unknown) => (v ? new Date(String(v)).toISOString() : ""),
    localDateTime: (v?: string | Date | null) => {
        const d = typeof v === "string" ? new Date(v) : v ?? null;
        return d && !Number.isNaN(d.getTime()) ? DTF.format(d) : "";
    },
    eur: (v: unknown) => (v == null || Number.isNaN(Number(v)) ? "" : EUR.format(Number(v))),
};

/* ========================= DataTable ========================= */
export type Column<T extends Record<string, unknown>> = {
    key: keyof T & string; header?: React.ReactNode;
    render?: (value: T[keyof T], row: T) => React.ReactNode;
    width?: React.CSSProperties["width"]; className?: string; hideSm?: boolean;
    titleFromValue?: boolean; smartTitle?: boolean;
};
export type DataTableProps<T extends Record<string, unknown>> = {
    rows: ReadonlyArray<T>; columns?: ReadonlyArray<Column<T>>; maxColumns?: number; caption?: string;
    onRowClick?: (row: T) => void; getRowKey?: (row: T, index: number) => React.Key;
    wrapperClassName?: string; tableClassName?: string; stickyHeader?: boolean; emptyLabel?: string;
};
const autoCols = <T extends Record<string, unknown>>(rows: ReadonlyArray<T>, max = 8): ReadonlyArray<Column<T>> => {
    const keys = new Set<string>(); for (let i = 0; i < rows.length; i++) for (const k of Object.keys(rows[i])) keys.add(k);
    return Array.from(keys).sort().slice(0,max).map((key)=>({key:key as keyof T & string, titleFromValue:true}));
};
const autoKey = (row: Record<string, unknown>, i: number) =>
    (row.id ?? (row as any).veilingProductNr ?? (row as any).veilingNr ?? (row as any).categorieNr ?? i) as React.Key;

const S_CELL_MAX0 = { maxWidth: 0 } as const;
const S_Z1 = { zIndex: 1 } as const;

const titleIfTruncated = (el: HTMLTableCellElement | null, title?: string) => {
    if (!el || !title || !isBrowser) return;
    requestAnimationFrame(() => { if (!el) return; el.scrollWidth > el.clientWidth ? (el.title = title) : el.removeAttribute("title"); });
};

function useGridNav(enabled: boolean) {
    const ref = useRef<HTMLTableSectionElement | null>(null);
    useEffect(() => {
        if (!enabled || !isBrowser) return;
        const el = ref.current; if (!el) return;
        const onKey = (e: KeyboardEvent) => {
            const row = (e.target as HTMLElement)?.closest("tr[tabindex]") as HTMLTableRowElement | null; if (!row) return;
            const rows = Array.from(el.querySelectorAll<HTMLTableRowElement>("tr[tabindex]"));
            const i = rows.indexOf(row); let next: HTMLTableRowElement | null = null;
            switch (e.key) { case "ArrowDown": next = rows[i+1]??null; break;
                case "ArrowUp": next = rows[i-1]??null; break;
                case "Home": next = rows[0]??null; break;
                case "End": next = rows[rows.length-1]??null; break;
                default: return; }
            if (next) { e.preventDefault(); next.focus(); }
        };
        el.addEventListener("keydown", onKey);
        return () => el.removeEventListener("keydown", onKey);
    }, [enabled]);
    return ref;
}

function DataTableInner<T extends Record<string, unknown>>({
                                                               rows, columns, maxColumns = 8, caption, onRowClick, getRowKey,
                                                               wrapperClassName = "table-responsive rounded-3 border",
                                                               tableClassName = "table table-sm table-striped table-hover align-middle caption-top",
                                                               stickyHeader = true, emptyLabel = "Geen resultaten.",
                                                           }: DataTableProps<T>) {
    if (!rows?.length) return <Empty label={emptyLabel} />;
    const cols = useMemo(() => (columns?.length ? columns : autoCols(rows, maxColumns)), [columns, rows, maxColumns]);
    const interactive = !!onRowClick, tableId = useId(), tbodyRef = useGridNav(interactive);
    const rowsRef = useRef(rows); rowsRef.current = rows;

    const onTbodyEvent = useCallback((
        ev: React.MouseEvent<HTMLTableSectionElement> | React.KeyboardEvent<HTMLTableSectionElement>
    ) => {
        if (!onRowClick) return;
        if ("key" in ev) { const e = ev as React.KeyboardEvent; if (e.key !== "Enter" && e.key !== " ") return; e.preventDefault(); }
        const tr = (ev.target as HTMLElement | null)?.closest("tr[data-i]") as HTMLTableRowElement | null; if (!tr) return;
        const idx = Number(tr.getAttribute("data-i")); Number.isFinite(idx) && onRowClick(rowsRef.current[idx]!);
    }, [onRowClick]);

    return (
        <div className={wrapperClassName}>
            <table className={tableClassName} aria-describedby={caption ? `${tableId}-caption` : undefined}>
                {caption && <caption id={`${tableId}-caption`} className="text-muted small px-2 pt-2">{caption}</caption>}
                <thead className={cx(stickyHeader && "position-sticky top-0","bg-body")} style={stickyHeader ? S_Z1 : undefined}>
                <tr className="table-light">
                    {cols.map((c) => (
                        <th key={c.key} scope="col"
                            className={cx("text-nowrap", c.className, c.hideSm && "d-none d-md-table-cell")}
                            style={c.width != null ? ({ width: c.width } as const) : undefined}>
                            {c.header ?? c.key}
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody ref={tbodyRef} onClick={interactive ? onTbodyEvent : undefined} onKeyDown={interactive ? onTbodyEvent : undefined}>
                {rows.map((row, i) => (
                    <tr key={getRowKey?.(row, i) ?? autoKey(row, i)} data-i={i} {...(interactive ? { tabIndex: 0, "aria-label": "Selecteer rij" } : { tabIndex: -1 })}>
                        {cols.map((c) => {
                            const val = row[c.key] as T[keyof T];
                            const content = c.render ? c.render(val, row) : fmt.text(val);
                            const wantsTitle = c.render ? c.titleFromValue : c.titleFromValue ?? true;
                            const rawTitle = wantsTitle ? (typeof val === "string" ? val : typeof val === "number" ? String(val) : undefined) : undefined;
                            const tdCls = cx("text-truncate", c.className, c.hideSm && "d-none d-md-table-cell");
                            return c.smartTitle && rawTitle ? (
                                <td key={c.key} className={tdCls} style={S_CELL_MAX0} ref={(el) => titleIfTruncated(el, rawTitle)}>{content}</td>
                            ) : (
                                <td key={c.key} className={tdCls} title={rawTitle} style={S_CELL_MAX0}>{content}</td>
                            );
                        })}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
export const DataTable = memo(DataTableInner) as typeof DataTableInner;

/* =========================== small UI bits =========================== */
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
export type FilterChipProps = { children: React.ReactNode; onClear: () => void; title?: string };
export const FilterChip = ({ children, onClear, title }: FilterChipProps) => (
    <span className="badge rounded-pill bg-light text-body-secondary border d-inline-flex align-items-center gap-2" title={title}>
    <span className="ps-2 text-truncate" style={{ maxWidth: 240 }}>{children}</span>
    <button type="button" className="btn btn-sm btn-link text-body-secondary py-0 pe-2" onClick={onClear} aria-label="Verwijder filter">×</button>
  </span>
);

/* ============================== Modal (fixed backdrop layering) ============================== */
type ModalProps = { title: React.ReactNode; onClose: () => void; children: React.ReactNode; size?: "sm" | "lg" | "xl" };

/** Portal modal: backdrop rendered as a separate sibling (z-index 1050) under dialog (1055). */
export const Modal: React.FC<ModalProps> = ({ title, onClose, children, size }) => {
    const portalRoot = isBrowser ? document.body : null;
    const contentRef = useRef<HTMLDivElement>(null);
    const titleId = `${useId()}-title`;
    const Z_BACKDROP = { zIndex: 1050 } as const;
    const Z_MODAL = { zIndex: 1055 } as const;

    // Scroll lock + focus trap + restore + ESC
    useIsoLE(() => {
        if (!isBrowser) return;
        const body = document.body, html = document.documentElement;
        const prevOverflow = body.style.overflow, prevPR = body.style.paddingRight;
        const sb = window.innerWidth - html.clientWidth;
        body.style.overflow = "hidden"; if (sb > 0) body.style.paddingRight = `${sb}px`;

        const prev = (document.activeElement as HTMLElement) || null;
        const q = 'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';
        const first = contentRef.current?.querySelector<HTMLElement>(q);
        (first ?? contentRef.current)?.focus();

        const onTab = (e: KeyboardEvent) => {
            if (e.key !== "Tab") return;
            const nodes = contentRef.current?.querySelectorAll<HTMLElement>(q); if (!nodes?.length) return;
            const f = Array.from(nodes).filter(n=>!n.hasAttribute("disabled"));
            const a = f[0], z = f[f.length-1];
            if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
            else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
        };
        const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };

        document.addEventListener("keydown", onTab, true);
        window.addEventListener("keydown", onEsc);

        return () => {
            body.style.overflow = prevOverflow; body.style.paddingRight = prevPR;
            document.removeEventListener("keydown", onTab, true);
            window.removeEventListener("keydown", onEsc);
            prev?.focus();
        };
    }, [onClose]);

    const dialogCls = cx("modal-dialog modal-dialog-centered", size==="sm"&&"modal-sm", size==="lg"&&"modal-lg", size==="xl"&&"modal-xl");

    const modalNode = (
        <div className="modal fade show d-block" style={Z_MODAL} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <div className={dialogCls} role="document">
                <div className="modal-content shadow" ref={contentRef} tabIndex={0}>
                    <div className="modal-header">
                        <h5 id={titleId} className="modal-title m-0">{title}</h5>
                        <button type="button" className="btn-close" aria-label="Sluiten" onClick={onClose} />
                    </div>
                    <div className="modal-body">{children}</div>
                </div>
            </div>
        </div>
    );

    const backdropNode = (
        <div
            className="modal-backdrop fade show"
            style={Z_BACKDROP}
            aria-hidden="true"
            onMouseDown={onClose}
        />
    );

    // Render backdrop and modal as siblings at <body> level to respect stacking order.
    return portalRoot
        ? <>
            {createPortal(backdropNode, portalRoot)}
            {createPortal(modalNode, portalRoot)}
        </>
        : modalNode;
};

/* ============================ VeilingModal ============================ */
type ApiVeiling = {
    veilingNr?: number; begintijd?: string; eindtijd?: string; status?: string; afbeelding?: string;
    product?: { naam?: string; startprijs?: number; voorraad?: number };
};
type VeilingRow = { veilingNr: number | ""; begintijd: string; eindtijd: string; status: string; product: string; };

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
        { key: "veilingNr", header: "#", width: 100, className: "text-nowrap" },
        { key: "begintijd", header: "Begintijd", className: "text-nowrap", smartTitle: true },
        { key: "eindtijd", header: "Eindtijd", className: "text-nowrap", smartTitle: true },
        { key: "status", header: "Status", className: "text-nowrap" },
        { key: "product", header: "Product", className: "w-100", smartTitle: true },
    ], []);

    const rows: VeilingRow[] = useMemo(() => (rowsRaw ?? []).map((v) => ({
        veilingNr: v.veilingNr ?? "", begintijd: fmt.localDateTime(v.begintijd), eindtijd: fmt.localDateTime(v.eindtijd),
        status: v.status ?? "", product: v.product?.naam ?? "",
    })), [rowsRaw]);

    return (
        <Modal title={<span>Veilingen voor product <span className="text-muted">#{productId}</span></span>} onClose={onClose} size="xl">
            {!rowsRaw && !error && (
                <div className="placeholder-glow" aria-live="polite" aria-busy="true">
                    <div className="placeholder col-12 mb-2" /><div className="placeholder col-10" />
                </div>
            )}
            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            {rowsRaw && !rowsRaw.length && !error && <div className="alert alert-warning mb-0">Geen veilingen gevonden.</div>}
            {rowsRaw && rowsRaw.length > 0 && (
                <div className="row g-3">
                    <div className="col-md-6">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                            <h6 className="m-0">Veilingen</h6>
                            <span className="badge bg-secondary-subtle text-secondary">{rowsRaw.length.toLocaleString("nl-NL")}</span>
                        </div>
                        <DataTable<VeilingRow>
                            rows={rows} columns={columns} caption="Klik een rij voor details"
                            onRowClick={(r) => setSel(rowsRaw?.find((v) => (v.veilingNr ?? "") === r.veilingNr) ?? null)}
                            emptyLabel="Geen veilingen."
                        />
                    </div>
                    <div className="col-md-6">
                        <h6 className="mb-2">Details</h6>
                        {!sel && <div className="text-muted">Selecteer een veiling in de tabel.</div>}
                        {sel && (
                            <div className="row g-3">
                                {sel.afbeelding && (
                                    <div className="col-12">
                                        <img src={sel.afbeelding} alt={sel.product?.naam || "product"} className="img-fluid rounded"
                                             loading="lazy" decoding="async" fetchpriority="low" sizes="(max-width: 768px) 100vw, 50vw" />
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
        </Modal>
    );
}

// Back-compat alias
export { DataTable as ArrayTable };
