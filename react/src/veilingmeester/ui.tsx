import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { apiGet } from "./data";

/* ===================== utils & formatters ===================== */
export const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(" ");

const safeString = (v: unknown): string => {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean" || typeof v === "bigint") return String(v);
    if (v instanceof Date) return v.toISOString();
    try {
        const seen = new WeakSet<object>();
        return JSON.stringify(v as any, (_k, val) => {
            if (typeof val === "bigint") return String(val);
            if (val && typeof val === "object") {
                if (seen.has(val as object)) return "[Circular]";
                seen.add(val as object);
            }
            return val;
        });
    } catch {
        try {
            return String(v as any);
        } catch {
            return "";
        }
    }
};

const EUR = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
export const fmt = {
    text: (v: unknown) => safeString(v),
    number: (v: unknown, d = 0) => (typeof v === "number" && Number.isFinite(v) ? v.toFixed(d) : ""),
    dateIso: (v: unknown) => (v ? new Date(String(v)).toISOString() : ""),
    localDateTime: (iso?: string) => {
        const d = iso ? new Date(iso) : null;
        return d && !Number.isNaN(d.getTime()) ? d.toLocaleString() : "";
    },
    eur: (v: unknown) => (v == null || Number.isNaN(Number(v)) ? "" : EUR.format(Number(v))),
};

/* ========================= DataTable ========================= */
export type Column<T extends Record<string, unknown>> = {
    key: keyof T & string;
    header?: React.ReactNode;
    render?: (value: unknown, row: T) => React.ReactNode;
    width?: React.CSSProperties["width"];
    className?: string;
    hideSm?: boolean;
    titleFromValue?: boolean; // default true when no custom render
};

export type DataTableProps<T extends Record<string, unknown>> = {
    rows: ReadonlyArray<T>;
    columns?: ReadonlyArray<Column<T>>;
    maxColumns?: number;
    caption?: string;
    onRowClick?: (row: T) => void;
    getRowKey?: (row: T, index: number) => React.Key;
    wrapperClassName?: string;
    tableClassName?: string;
    stickyHeader?: boolean;
    emptyLabel?: string;
};

const autoCols = <T extends Record<string, unknown>>(rows: ReadonlyArray<T>, max = 8): ReadonlyArray<Column<T>> => {
    const keys = new Set<string>();
    rows.forEach((r) => Object.keys(r).forEach((k) => keys.add(k)));
    return Array.from(keys)
        .sort()
        .slice(0, max)
        .map((key) => ({ key: key as keyof T & string, titleFromValue: true }));
};

const autoKey = (row: Record<string, unknown>, i: number) =>
    (row.id ?? (row as any).veilingProductNr ?? (row as any).veilingNr ?? (row as any).categorieNr ?? i) as React.Key;

export function DataTable<T extends Record<string, unknown>>({
                                                                 rows,
                                                                 columns,
                                                                 maxColumns = 8,
                                                                 caption,
                                                                 onRowClick,
                                                                 getRowKey,
                                                                 wrapperClassName = "table-responsive rounded-3 border",
                                                                 tableClassName =
                                                                 "table table-sm table-striped table-hover align-middle caption-top",
                                                                 stickyHeader = true,
                                                                 emptyLabel = "Geen resultaten.",
                                                             }: DataTableProps<T>) {
    if (!rows?.length) return <Empty label={emptyLabel} />;
    const cols = useMemo(() => (columns?.length ? columns : autoCols(rows, maxColumns)), [columns, rows, maxColumns]);
    const interactive = Boolean(onRowClick);

    return (
        <div className={wrapperClassName}>
            <table className={tableClassName} role="table">
                {caption && <caption className="text-muted small px-2 pt-2">{caption}</caption>}
                <thead
                    className={cx(
                        stickyHeader && "position-sticky top-0",
                        "bg-body"
                    )}
                    style={stickyHeader ? { zIndex: 1 } : undefined}
                >
                <tr className="table-light">
                    {cols.map((c) => (
                        <th
                            key={c.key}
                            scope="col"
                            className={cx("text-nowrap", c.className, c.hideSm && "d-none d-md-table-cell")}
                            style={c.width ? { width: c.width } : undefined}
                        >
                            {c.header ?? c.key}
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {rows.map((row, i) => (
                    <tr
                        key={getRowKey?.(row, i) ?? autoKey(row, i)}
                        {...(interactive
                            ? {
                                onClick: () => onRowClick?.(row),
                                onKeyDown: (e: React.KeyboardEvent) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        onRowClick?.(row);
                                    }
                                },
                                role: "button" as const,
                                tabIndex: 0,
                                className: "cursor-pointer",
                                "aria-label": "Selecteer rij",
                            }
                            : {})}
                    >
                        {cols.map((c) => {
                            const val = (row as any)[c.key];
                            const content = c.render ? c.render(val, row) : fmt.text(val);
                            const wantsTitle = c.render ? c.titleFromValue : c.titleFromValue ?? true;
                            const title = wantsTitle
                                ? (typeof val === "string" && val) || (typeof val === "number" ? String(val) : undefined)
                                : undefined;
                            return (
                                <td
                                    key={c.key}
                                    className={cx("text-truncate", c.className, c.hideSm && "d-none d-md-table-cell")}
                                    title={title}
                                    style={{ maxWidth: 0 }}
                                >
                                    {content}
                                </td>
                            );
                        })}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

/* =========================== small UI bits =========================== */
export const SpinnerInline = ({ text = "Laden…" }: { text?: string }) => (
    <span className="d-inline-flex align-items-center gap-2 text-muted" aria-live="polite" role="status">
    <span className="spinner-border spinner-border-sm" aria-hidden="true" />
    <span>{text}</span>
  </span>
);

export const Empty = ({ label = "Geen resultaten." }: { label?: string }) => (
    <div className="text-center text-muted py-5" role="status" aria-live="polite" aria-label="geen resultaten">
        <div className="display-6 mb-2">🌿</div>
        <p className="m-0">{label}</p>
    </div>
);

export type FilterChipProps = { children: React.ReactNode; onClear: () => void; title?: string };
export const FilterChip = ({ children, onClear, title }: FilterChipProps) => (
    <span
        className="badge rounded-pill bg-light text-body-secondary border d-inline-flex align-items-center gap-2"
        title={title}
    >
    <span className="ps-2 text-truncate" style={{ maxWidth: 240 }}>
      {children}
    </span>
    <button
        type="button"
        className="btn btn-sm btn-link text-body-secondary py-0 pe-2"
        onClick={onClear}
        aria-label="Verwijder filter"
    >
      ×
    </button>
  </span>
);

/* ============================== Modal ============================== */

type ModalProps = { title: React.ReactNode; onClose: () => void; children: React.ReactNode; size?: "sm" | "lg" | "xl" };
export const Modal: React.FC<ModalProps> = ({ title, onClose, children, size }) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);
    useLayoutEffect(() => {
        const prev = document.activeElement as HTMLElement | null;
        ref.current?.focus();
        return () => prev?.focus();
    }, []);
    const dialogCls = cx(
        "modal-dialog modal-dialog-centered",
        size === "sm" && "modal-sm",
        size === "lg" && "modal-lg",
        size === "xl" && "modal-xl"
    );
    return (
        <div className="modal d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-backdrop show" onClick={onClose} />
            <div className={dialogCls} role="document">
                <div className="modal-content shadow" ref={ref} tabIndex={0}>
                    <div className="modal-header">
                        <h5 className="modal-title m-0">{title}</h5>
                        <button type="button" className="btn-close" aria-label="Sluiten" onClick={onClose} />
                    </div>
                    <div className="modal-body">{children}</div>
                </div>
            </div>
        </div>
    );
};

/* ============================ VeilingModal ============================ */

type ApiVeiling = {
    veilingNr?: number;
    begintijd?: string;
    eindtijd?: string;
    status?: string;
    afbeelding?: string;
    product?: { naam?: string; startprijs?: number; voorraad?: number };
};

export function VeilingModal({ productId, onClose }: { productId: number; onClose: () => void }) {
    const [lijst, setLijst] = useState<ApiVeiling[] | null>(null);
    const [sel, setSel] = useState<ApiVeiling | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let canceled = false;
        setLijst(null);
        setSel(null);
        setError(null);
        (async () => {
            try {
                const res = await apiGet<ApiVeiling[]>("/api/Veiling", { veilingProduct: productId, page: 1, pageSize: 100 });
                if (canceled) return;
                const rows = res ?? [];
                setLijst(rows);
                setSel(rows[0] ?? null);
            } catch {
                if (!canceled) {
                    setLijst([]);
                    setSel(null);
                    setError("Kon veilingen niet ophalen.");
                }
            }
        })();
        return () => {
            canceled = true;
        };
    }, [productId]);

    const columns = useMemo(
        () =>
            ([
                { key: "veilingNr", header: "#", width: 100, className: "text-nowrap" },
                { key: "begintijd", header: "Begintijd", className: "text-nowrap" },
                { key: "eindtijd", header: "Eindtijd", className: "text-nowrap" },
                { key: "status", header: "Status", className: "text-nowrap" },
                { key: "product", header: "Product", className: "w-100" },
            ] as const),
        []
    );

    const rows = useMemo(
        () =>
            (lijst ?? []).map((v) => ({
                veilingNr: v.veilingNr ?? "",
                begintijd: fmt.localDateTime(v.begintijd),
                eindtijd: fmt.localDateTime(v.eindtijd),
                status: v.status ?? "",
                product: v.product?.naam ?? "",
            })),
        [lijst]
    );

    return (
        <Modal
            title={
                <span>
          Veilingen voor product <span className="text-muted">#{productId}</span>
        </span>
            }
            onClose={onClose}
            size="xl"
        >
            {!lijst && !error && (
                <div className="placeholder-glow">
                    <div className="placeholder col-12 mb-2" />
                    <div className="placeholder col-10" />
                </div>
            )}
            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}
            {lijst && !lijst.length && !error && <div className="alert alert-warning mb-0">Geen veilingen gevonden.</div>}
            {lijst && lijst.length > 0 && (
                <div className="row g-3">
                    <div className="col-md-6">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                            <h6 className="m-0">Veilingen</h6>
                            <span className="badge bg-secondary-subtle text-secondary">{lijst.length}</span>
                        </div>
                        <DataTable
                            rows={rows}
                            columns={columns as any}
                            caption="Klik een rij voor details"
                            onRowClick={(r: any) => setSel(lijst?.find((v) => v.veilingNr === r.veilingNr) ?? null)}
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
                                        <img src={sel.afbeelding} alt={sel.product?.naam ?? "product"} className="img-fluid rounded" loading="lazy" />
                                    </div>
                                )}
                                <div className="col-12">
                                    <h5 className="mb-1">{sel.product?.naam}</h5>
                                    <div className="text-muted mb-2">
                                        Veiling #{sel.veilingNr} • {sel.status ?? "Status onbekend"}
                                    </div>
                                    <dl className="row mb-0">
                                        <dt className="col-5 col-md-4">Startprijs</dt>
                                        <dd className="col-7 col-md-8">{fmt.eur(sel.product?.startprijs)}</dd>
                                        <dt className="col-5 col-md-4">Voorraad</dt>
                                        <dd className="col-7 col-md-8">{sel.product?.voorraad ?? ""}</dd>
                                        <dt className="col-5 col-md-4">Begintijd</dt>
                                        <dd className="col-7 col-md-8">{fmt.localDateTime(sel.begintijd)}</dd>
                                        <dt className="col-5 col-md-4">Eindtijd</dt>
                                        <dd className="col-7 col-md-8">{fmt.localDateTime(sel.eindtijd)}</dd>
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