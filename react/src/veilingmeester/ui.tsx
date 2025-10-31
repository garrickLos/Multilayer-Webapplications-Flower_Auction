import React, {
    memo,
    useCallback,
    useDeferredValue,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";
import { apiGet } from "./data";

/* =============================== internal utils =============================== */
/* not exported — keeps Fast Refresh happy */
const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
const cx = (...a: Array<string | false | null | undefined>) => a.filter(Boolean).join(" ");

const S = (v: unknown): string =>
    v == null
        ? ""
        : v instanceof Date
            ? v.toISOString()
            : typeof v === "object"
                ? (() => {
                    try {
                        return JSON.stringify(v as Record<string, unknown>);
                    } catch {
                        return "";
                    }
                })()
                : String(v);

const collator = isBrowser ? new Intl.Collator("nl-NL", { numeric: true, sensitivity: "base" }) : null;
const compareStr = (a: string, b: string) => (collator ? collator.compare(a, b) : a.localeCompare(b));

const fmtDate = (d: Date) =>
    isBrowser ? new Intl.DateTimeFormat("nl-NL", { dateStyle: "short", timeStyle: "short" }).format(d) : d.toISOString();

const fmtEur = (n?: number | null) =>
    n == null || Number.isNaN(+n)
        ? ""
        : isBrowser
            ? new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(+n)
            : `€${(+n).toFixed(2)}`;

const stableSort = <T,>(a: readonly T[], cmp: (x: T, y: T) => number) =>
    a
        .map((x, i) => [x, i] as const)
        .sort((A, B) => cmp(A[0], B[0]) || A[1] - B[1])
        .map(([x]) => x);

/* =================================== table =================================== */
export type SortDir = "asc" | "desc";
type RowBase = Record<string, unknown>;

export type Column<T extends RowBase> = {
    key: keyof T & string;
    header?: React.ReactNode;
    accessor?: (row: T) => unknown;
    render?: (val: unknown, row: T) => React.ReactNode;
    className?: string;
    width?: React.CSSProperties["width"];
    sortable?: boolean;
    hideSm?: boolean;
    comparator?: (a: T, b: T, dir: SortDir) => number;
};

type DataTableProps<T extends RowBase> = {
    rows: readonly T[];
    columns?: ReadonlyArray<Column<T>>;
    caption?: string;
    onRowClick?: (row: T) => void;
    getRowKey?: (row: T, i: number) => React.Key;
    defaultSortKey?: keyof T & string;
    defaultSortDir?: SortDir;
    filterPlaceholder?: string;
};

function autoColumns<T extends RowBase>(rows: readonly T[], max = 8): ReadonlyArray<Column<T>> {
    return Array.from(new Set(rows.flatMap((r) => Object.keys(r))))
        .slice(0, max)
        .map((k) => ({ key: k as keyof T & string, sortable: true }));
}

export function DataTableInner<T extends RowBase>({
                                                      rows,
                                                      columns,
                                                      caption,
                                                      onRowClick,
                                                      getRowKey,
                                                      defaultSortKey,
                                                      defaultSortDir = "asc",
                                                      filterPlaceholder = "zoeken…",
                                                  }: DataTableProps<T>) {
    const cols = useMemo(() => (columns?.length ? columns : autoColumns(rows)), [columns, rows]);
    const [sortKey, setSortKey] = useState<keyof T & string | undefined>(defaultSortKey);
    const [sortDir, setSortDir] = useState<SortDir>(defaultSortDir);
    const [q, setQ] = useState("");
    const dq = useDeferredValue(q).trim().toLowerCase();
    const tableId = useId();

    const cmp = useMemo(() => {
        if (!sortKey) return null as ((a: T, b: T) => number) | null;
        const col = cols.find((c) => c.key === sortKey);
        if (col?.comparator) return (a: T, b: T) => col.comparator!(a, b, sortDir);
        return (a: T, b: T) => {
            const av: unknown = col?.accessor ? col.accessor(a) : (a[sortKey as keyof T] as unknown);
            const bv: unknown = col?.accessor ? col.accessor(b) : (b[sortKey as keyof T] as unknown);
            const na = typeof av === "number" ? av : Number.isFinite(Number(av)) ? Number(av) : NaN;
            const nb = typeof bv === "number" ? bv : Number.isFinite(Number(bv)) ? Number(bv) : NaN;
            const r = Number.isFinite(na) && Number.isFinite(nb) ? (na as number) - (nb as number) : compareStr(S(av), S(bv));
            return sortDir === "asc" ? r : -r;
        };
    }, [cols, sortKey, sortDir]);

    const filtered = useMemo(
        () =>
            !dq
                ? rows
                : rows.filter((r) =>
                    cols.some((c) => S(c.accessor ? c.accessor(r) : (r[c.key as keyof T] as unknown)).toLowerCase().includes(dq))
                ),
        [rows, dq, cols]
    );
    const data = useMemo(() => (cmp ? stableSort(filtered, cmp) : filtered), [filtered, cmp]);

    const toggleSort = useCallback(
        (key: keyof T & string) => {
            setSortKey(key);
            setSortDir((d) => (sortKey === key ? (d === "asc" ? "desc" : "asc") : "asc"));
        },
        [sortKey]
    );

    if (!rows?.length) return <Empty />;

    return (
        <section className="p-2" aria-label="tabel">
            <div className="card shadow-sm border-0 border border-success-subtle">
                {caption && (
                    <div className="card-header bg-success-subtle border-0 py-2">
                        <div id={`${tableId}-caption`} className="small text-success">
                            {caption}
                        </div>
                    </div>
                )}
                <div className="card-body pt-2">
                    <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="badge bg-success-subtle text-success" aria-live="polite">
              {data.length.toLocaleString("nl-NL")} resultaten
            </span>
                        <div className="input-group input-group-sm" style={{ maxWidth: 320 }}>
                            <span className="input-group-text bg-success-subtle text-success border-success-subtle">Zoek</span>
                            <input
                                className="form-control"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder={filterPlaceholder}
                                aria-label="Filter resultaten"
                                inputMode="search"
                                autoComplete="off"
                            />
                            {!!q && (
                                <button className="btn btn-outline-secondary" onClick={() => setQ("")}>
                                    Wissen
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="table-responsive rounded-3 border bg-body">
                        <table
                            className="table table-sm table-striped table-hover align-middle caption-top"
                            aria-describedby={caption ? `${tableId}-caption` : undefined}
                        >
                            <thead className="position-sticky top-0 bg-success-subtle" style={{ zIndex: 1 }}>
                            <tr>
                                {cols.map((c) => {
                                    const active = sortKey === c.key;
                                    return (
                                        <th
                                            key={c.key}
                                            scope="col"
                                            aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                                            className={cx(
                                                "text-nowrap text-success",
                                                c.className,
                                                c.hideSm && "d-none d-md-table-cell",
                                                c.sortable && "user-select-none"
                                            )}
                                            style={c.width != null ? { width: c.width } : undefined}
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
                            {data.map((row, i) => (
                                <tr
                                    key={getRowKey?.(row, i) ?? i}
                                    onClick={() => onRowClick?.(row)}
                                    tabIndex={onRowClick ? 0 : -1}
                                    role={onRowClick ? "button" : undefined}
                                    onKeyDown={(e) => {
                                        if (!onRowClick) return;
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            onRowClick(row);
                                        }
                                    }}
                                >
                                    {cols.map((c) => {
                                        const v: unknown = c.accessor ? c.accessor(row) : (row[c.key as keyof T] as unknown);
                                        return (
                                            <td
                                                key={c.key}
                                                className={cx("text-truncate", c.className, c.hideSm && "d-none d-md-table-cell")}
                                                style={{ maxWidth: 0 }}
                                            >
                                                {c.render ? c.render(v, row) : S(v)}
                                            </td>
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

/* ================================== bits ================================== */
export const Empty = ({ label = "Geen resultaten." }: { label?: string }) => (
    <div className="text-center text-muted py-5" role="status" aria-live="polite" aria-label="geen resultaten">
        <div className="display-6 mb-2">🌿</div>
        <p className="m-0">{label}</p>
    </div>
);

/* ================================== modal ================================= */
type ModalProps = {
    title: React.ReactNode;
    onClose: () => void;
    children: React.ReactNode;
    size?: "sm" | "lg" | "xl";
    fullscreenUntil?: "sm" | "md" | "lg" | "xl" | "xxl";
    maxWidthPx?: number;
    autoFocusSelector?: string;
};

export const Modal: React.FC<ModalProps> = ({
                                                title,
                                                onClose,
                                                children,
                                                size,
                                                fullscreenUntil,
                                                maxWidthPx,
                                                autoFocusSelector,
                                            }) => {
    const portalRoot = isBrowser ? document.body : null;
    const titleId = `${useId()}-title`;
    const prevFocus = useRef<HTMLElement | null>(null);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isBrowser) return;
        prevFocus.current = document.activeElement as HTMLElement | null;
        const oldOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        const id = window.setTimeout(() => (ref.current?.querySelector(autoFocusSelector ?? "button.btn-close") as
            | HTMLElement
            | null)?.focus?.(), 0);
        return () => {
            window.clearTimeout(id);
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = oldOverflow;
            prevFocus.current?.focus?.();
        };
    }, [onClose, autoFocusSelector]);

    const dialogCls = cx(
        "modal-dialog modal-dialog-centered modal-dialog-scrollable",
        fullscreenUntil ? `modal-fullscreen-${fullscreenUntil}-down` : "modal-fullscreen-sm-down",
        size === "sm" && "modal-sm",
        size === "lg" && "modal-lg",
        size === "xl" && "modal-xl"
    );
    const dialogStyle = fullscreenUntil ? undefined : maxWidthPx ? { maxWidth: `min(98vw, ${maxWidthPx}px)` } : undefined;

    const modalNode = (
        <div
            className="modal show d-block"
            style={{ zIndex: 1055 }}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            ref={ref}
        >
            <div className={dialogCls} role="document" style={dialogStyle}>
                <div className="modal-content shadow border-0">
                    <div className="modal-header bg-success-subtle">
                        <h5 id={titleId} className="modal-title m-0 text-success">
                            {title}
                        </h5>
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
    return portalRoot ? (
        <>
            {createPortal(backdropNode, portalRoot)}
            {createPortal(modalNode, portalRoot)}
        </>
    ) : (
        modalNode
    );
};

/* ============================== veiling modal ============================== */
type ApiVeiling = {
    veilingNr?: number;
    begintijd?: string; // ISO
    eindtijd?: string; // ISO
    status?: string;
    afbeelding?: string;
    product?: { naam?: string; startprijs?: number; voorraad?: number };
};

type VeilingRow = {
    veilingNr: number | "";
    begintijd: string; // localized
    eindtijd: string; // localized
    begintijdTs: number;
    eindtijdTs: number;
    status: string;
    product: string;
};

const StatusBadge = ({ status }: { status?: string | null }) => {
    if (!status) return null;
    const s = status.toLowerCase();
    const name = s.includes("actief")
        ? "bg-success-subtle text-success"
        : s.includes("afgesloten")
            ? "bg-secondary-subtle text-secondary"
            : s.includes("gepland")
                ? "bg-info-subtle text-info"
                : "bg-light text-body";
    return <span className={cx("badge", name)}>{status}</span>;
};

export function VeilingModal({ productId, onClose }: { productId: number; onClose: () => void }) {
    const [rowsRaw, setRowsRaw] = useState<ApiVeiling[] | null>(null);
    const [sel, setSel] = useState<ApiVeiling | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const ctl = new AbortController();
        setRowsRaw(null);
        setSel(null);
        setError(null);
        (async () => {
            try {
                const url = `/api/Veiling?veilingProduct=${encodeURIComponent(productId)}&page=1&pageSize=100`;
                const res = await apiGet<ApiVeiling[]>(url, { signal: ctl.signal });
                if (ctl.signal.aborted) return;
                const rows = res ?? [];
                setRowsRaw(rows);
                setSel(rows[0] ?? null);
            } catch (e) {
                if (!ctl.signal.aborted) {
                    console.error(e);
                    setRowsRaw([]);
                    setError("Kon veilingen niet ophalen.");
                }
            }
        })();
        return () => ctl.abort();
    }, [productId]);

    const columns = useMemo<ReadonlyArray<Column<VeilingRow>>>(
        () => [
            { key: "veilingNr", header: "#", width: 96, className: "text-nowrap", sortable: true },
            {
                key: "begintijd",
                header: "Begintijd",
                className: "text-nowrap",
                sortable: true,
                comparator: (a, b, dir) => (dir === "asc" ? a.begintijdTs - b.begintijdTs : b.begintijdTs - a.begintijdTs),
            },
            {
                key: "eindtijd",
                header: "Eindtijd",
                className: "text-nowrap",
                sortable: true,
                hideSm: true,
                comparator: (a, b, dir) => (dir === "asc" ? a.eindtijdTs - b.eindtijdTs : b.eindtijdTs - a.eindtijdTs),
            },
            { key: "status", header: "Status", className: "text-nowrap", sortable: true, hideSm: true },
            { key: "product", header: "Product", className: "text-nowrap", sortable: true },
        ],
        []
    );

    const rows: VeilingRow[] = useMemo(
        () =>
            (rowsRaw ?? []).map((v) => {
                const bt = v.begintijd ? Date.parse(v.begintijd) : NaN;
                const et = v.eindtijd ? Date.parse(v.eindtijd) : NaN;
                return {
                    veilingNr: v.veilingNr ?? "",
                    begintijd: v.begintijd ? fmtDate(new Date(v.begintijd)) : "",
                    eindtijd: v.eindtijd ? fmtDate(new Date(v.eindtijd)) : "",
                    begintijdTs: Number.isNaN(bt) ? Number.NEGATIVE_INFINITY : bt,
                    eindtijdTs: Number.isNaN(et) ? Number.NEGATIVE_INFINITY : et,
                    status: v.status ?? "",
                    product: v.product?.naam ?? "",
                };
            }),
        [rowsRaw]
    );

    return (
        <Modal title={<span>Veilingen <span className="text-muted">#{productId}</span></span>} onClose={onClose} size="xl" fullscreenUntil="lg" maxWidthPx={1400}>
            {!rowsRaw && !error && (
                <div className="placeholder-glow" aria-live="polite" aria-busy="true">
                    <div className="placeholder col-12 mb-2" />
                    <div className="placeholder col-10" />
                </div>
            )}
            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}
            {rowsRaw && (
                <div className="row g-3">
                    <div className="col-lg-8 col-md-7">
                        <DataTable<VeilingRow>
                            rows={rows}
                            columns={columns}
                            caption="Klik een rij voor details"
                            onRowClick={(r) => setSel(rowsRaw?.find((v) => (v.veilingNr ?? "") === r.veilingNr) ?? null)}
                            getRowKey={(r) => r.veilingNr || `${r.product}-${r.begintijdTs}`}
                            defaultSortKey="begintijd"
                            defaultSortDir="asc"
                        />
                    </div>
                    <div className="col-lg-4 col-md-5">
                        <article className="card shadow-sm border-0 border border-success-subtle">
                            {sel?.afbeelding && (
                                <div className="ratio ratio-16x9">
                                    <img
                                        src={sel.afbeelding}
                                        alt={sel.product?.naam || "product"}
                                        className="w-100 h-100 object-fit-cover rounded-top"
                                        loading="lazy"
                                        decoding="async"
                                        fetchPriority="low"
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                    />
                                </div>
                            )}
                            <div className="card-body">
                                <h5 className="card-title d-flex align-items-center gap-2 mb-1 text-success">
                                    {sel?.product?.naam || <span className="text-muted">Geen naam</span>}
                                    <StatusBadge status={sel?.status} />
                                </h5>
                                <div className="text-muted mb-3">
                                    {sel ? <>Veiling #{sel.veilingNr}</> : "Selecteer een veiling in de tabel."}
                                </div>
                                {sel && (
                                    <ul className="list-group list-group-flush">
                                        <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                                            <span className="text-muted">Startprijs</span>
                                            <strong>{fmtEur(sel.product?.startprijs)}</strong>
                                        </li>
                                        <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                                            <span className="text-muted">Voorraad</span>
                                            <span>{sel.product?.voorraad ?? ""}</span>
                                        </li>
                                        <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                                            <span className="text-muted">Begintijd</span>
                                            <span>{sel.begintijd ? fmtDate(new Date(sel.begintijd)) : ""}</span>
                                        </li>
                                        <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                                            <span className="text-muted">Eindtijd</span>
                                            <span>{sel.eindtijd ? fmtDate(new Date(sel.eindtijd)) : ""}</span>
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

/* ================================ FilterChip ================================ */
export const FilterChip = ({
                               children,
                               onClear,
                               title,
                           }: {
    children: React.ReactNode;
    onClear: () => void;
    title?: string;
}) => (
    <span
        className="badge rounded-pill bg-success-subtle text-success border d-inline-flex align-items-center gap-2 border-success-subtle"
        title={title}
    >
    <span className="ps-2 text-truncate" style={{ maxWidth: 240 }}>
      {children}
    </span>
    <button type="button" className="btn btn-sm btn-link text-success py-0 pe-2" onClick={onClear} aria-label="Verwijder filter">
      ×
    </button>
  </span>
);

/* alias (components only) */
export { DataTable as ArrayTable };
