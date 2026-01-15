import { useMemo, useState, type JSX, type ReactNode } from "react";

/**
 * Simpele paginering helper:
 * Berekent start index op basis van page en pageSize en geeft een slice terug.
 */
const paginate = <T,>(rows: readonly T[], page: number, pageSize: number): readonly T[] => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
};

/**
 * Helper voor conditionele classnames.
 * Negeert falsy waarden en plakt de rest samen.
 */
const cx = (...classes: Array<string | false | null | undefined>): string =>
    classes.filter(Boolean).join(" ");

/**
 * Definitie van een tabelkolom:
 * - key: unieke sleutel (en default property key op row)
 * - header: kolomtitel
 * - sortable: of de kolom sorteerbaar is
 * - render: custom render voor een cell
 * - getValue: waarde die gebruikt wordt voor sorteren (als render anders is)
 * - align: tekstuitlijning van de cellen
 */
export type TableColumn<T> = {
    readonly key: string;
    readonly header: string;
    readonly sortable?: boolean;
    readonly render?: (row: T) => ReactNode;
    readonly getValue?: (row: T) => string | number;
    readonly align?: "start" | "center" | "end";
};

/**
 * Props voor de generieke tabel:
 * - columns/rows/getRowId: basis tabel data
 * - search/filters: optionele zoekbalk en extra filters UI
 * - page/pageSize/pageSizeOptions/total: paginering
 * - onPageChange/onPageSizeChange: callbacks voor paginering
 * - onRowClick: optioneel klikbaar maken van rijen
 * - selectable: optionele selectie (checkboxes) per rij/pagina
 * - emptyMessage/emptyState: weergave wanneer er geen resultaten zijn
 */
export type TableProps<T> = {
    readonly columns: readonly TableColumn<T>[];
    readonly rows: readonly T[];
    readonly getRowId: (row: T) => string | number;

    readonly search?: { value: string; onChange: (value: string) => void; placeholder?: string };
    readonly filters?: ReactNode;

    readonly page: number;
    readonly pageSize: number;
    readonly pageSizeOptions: readonly number[];
    readonly total?: number;

    readonly onPageChange: (page: number) => void;
    readonly onPageSizeChange: (size: number) => void;
    readonly onRowClick?: (row: T) => void;

    readonly selectable?: {
        selectedIds: readonly (string | number)[];
        onToggleRow: (id: string | number) => void;
        onTogglePage: (ids: readonly (string | number)[], checked: boolean) => void;
    };

    readonly emptyMessage?: ReactNode;
    readonly emptyState?: ReactNode;
};

/**
 * Sorteer-icoon voor kolomkoppen:
 * - asc: ▲
 * - desc: ▼
 * - null: ↕ (niet actief)
 */
const SortIcon = ({ direction }: { readonly direction: "asc" | "desc" | null }): JSX.Element => (
    <span aria-hidden="true" className="ms-1">
        {direction === "asc" && "▲"}
        {direction === "desc" && "▼"}
        {direction === null && "↕"}
    </span>
);

/**
 * Generieke Table component met:
 * - sorteren (stabiel)
 * - paginering
 * - optioneel zoeken/filters
 * - optioneel selecteerbare rijen
 * - empty state weergave
 */
export function Table<T>({
                             columns,
                             rows,
                             getRowId,
                             search,
                             filters,
                             page,
                             pageSize,
                             pageSizeOptions,
                             onPageChange,
                             onPageSizeChange,
                             onRowClick,
                             selectable,
                             emptyMessage = "Geen resultaten",
                             emptyState,
                             total,
                         }: TableProps<T>): JSX.Element {
    // Huidige sorteertoestand (kolom key + richting) of null als er niet gesorteerd wordt
    const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

    /**
     * Gesorteerde rijen (stabiel sorteren):
     * - gebruikt getValue() indien aanwezig, anders row[column.key]
     * - bij gelijke waarden blijft de originele volgorde gelijk (via index)
     */
    const sortedRows = useMemo(() => {
        if (!sort) return rows;

        const column = columns.find((col) => col.key === sort.key);
        if (!column) return rows;

        const factor = sort.direction === "asc" ? 1 : -1;

        return [...rows]
            .map((row, index) => ({ row, index }))
            .sort((a, b) => {
                const aValue = column.getValue
                    ? column.getValue(a.row)
                    : (a.row as Record<string, unknown>)[column.key];

                const bValue = column.getValue
                    ? column.getValue(b.row)
                    : (b.row as Record<string, unknown>)[column.key];

                const aPrimitive = typeof aValue === "number" ? aValue : String(aValue ?? "");
                const bPrimitive = typeof bValue === "number" ? bValue : String(bValue ?? "");

                const comparison =
                    typeof aPrimitive === "number" && typeof bPrimitive === "number"
                        ? aPrimitive - bPrimitive
                        : String(aPrimitive).localeCompare(String(bPrimitive), "nl-NL", {
                            sensitivity: "base",
                            numeric: true,
                        });

                // Bij gelijke waarde: gebruik originele index om stabiel te blijven
                return comparison !== 0 ? comparison * factor : a.index - b.index;
            })
            .map((entry) => entry.row);
    }, [columns, rows, sort]);

    // Paginering: total kan apart meegegeven worden (bijv. server-side paging)
    const totalRows = total ?? rows.length;

    // Rows voor de huidige pagina (op basis van sorteerresultaat)
    const pageRows = useMemo(
        () => paginate(sortedRows, page, pageSize),
        [sortedRows, page, pageSize],
    );

    // Bepaalt of er nog een volgende pagina is
    const hasNext = page * pageSize < totalRows;

    /**
     * Selectie per pagina:
     * - selectedIds: huidige selectie
     * - pageIds: ids van rijen op deze pagina
     * - allPageSelected: true als alle ids op pagina geselecteerd zijn
     */
    const selectedIds = selectable?.selectedIds ?? [];
    const pageIds = pageRows.map((row) => getRowId(row));
    const allPageSelected = selectable
        ? pageIds.every((id) => selectedIds.includes(id))
        : false;

    // Selecteer/deselecteer alle rijen op huidige pagina
    const handleHeaderToggle = () => {
        if (!selectable) return;
        selectable.onTogglePage(pageIds, !allPageSelected);
    };

    /**
     * Sorteren bij klik op kolomkop:
     * - als dezelfde kolom opnieuw: toggle asc/desc
     * - anders: start met asc
     */
    const handleSort = (column: TableColumn<T>) => {
        if (!column.sortable) return;

        setSort((prev) =>
            prev?.key === column.key
                ? { key: column.key, direction: prev.direction === "asc" ? "desc" : "asc" }
                : { key: column.key, direction: "asc" },
        );
    };

    return (
        <div className="d-flex flex-column gap-3">
            {/* Zoeken, filters en pagina-grootte */}
            {(search || filters) && (
                <div className="d-flex flex-wrap align-items-end gap-3">
                    {search && (
                        <label className="flex-grow-1 d-flex flex-column gap-1">
                            <span className="small text-uppercase text-success-emphasis fw-semibold">
                                Zoeken
                            </span>
                            <input
                                type="search"
                                className="form-control border-success-subtle"
                                placeholder={search.placeholder ?? "Zoeken"}
                                value={search.value}
                                onChange={(event) => search.onChange(event.target.value)}
                            />
                        </label>
                    )}

                    {/* Extra filters UI (van buitenaf meegegeven) */}
                    {filters}

                    {/* Pagina grootte selector */}
                    <label className="d-flex flex-column gap-1" style={{ minWidth: "140px" }}>
                        <span className="small text-uppercase text-success-emphasis fw-semibold">
                            Per pagina
                        </span>
                        <select
                            className="form-select border-success-subtle"
                            value={String(pageSize)}
                            onChange={(event) => onPageSizeChange(Number(event.target.value))}
                        >
                            {pageSizeOptions.map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            )}

            {/* Lege staat: geen rows op deze pagina */}
            {pageRows.length === 0 ? (
                emptyState ?? (
                    <div className="text-center text-muted py-4">
                        {emptyMessage}
                    </div>
                )
            ) : (
                <div className="table-responsive shadow-sm rounded-4 border border-success-subtle">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-success-subtle">
                        <tr>
                            {/* Checkbox header voor selectie (alleen als selectable aan staat) */}
                            {selectable && (
                                <th scope="col" className="text-center" style={{ width: 48 }}>
                                    <input
                                        type="checkbox"
                                        className="form-check-input border-success-subtle"
                                        checked={allPageSelected}
                                        aria-label="Selecteer alles"
                                        onChange={handleHeaderToggle}
                                    />
                                </th>
                            )}

                            {/* Kolom headers */}
                            {columns.map((column) => {
                                const direction =
                                    sort?.key === column.key ? sort.direction : null;

                                return (
                                    <th
                                        key={column.key}
                                        scope="col"
                                        className={cx(
                                            "text-uppercase small text-success-emphasis",
                                            column.sortable && "user-select-none",
                                        )}
                                    >
                                        {column.sortable ? (
                                            <button
                                                type="button"
                                                className="btn btn-link p-0 text-decoration-none text-success fw-semibold"
                                                onClick={() => handleSort(column)}
                                            >
                                                    <span className="d-inline-flex align-items-center">
                                                        {column.header}
                                                        <SortIcon direction={direction} />
                                                    </span>
                                            </button>
                                        ) : (
                                            column.header
                                        )}
                                    </th>
                                );
                            })}
                        </tr>
                        </thead>

                        <tbody>
                        {pageRows.map((row, index) => {
                            const id = getRowId(row);
                            const isSelected =
                                selectable?.selectedIds.includes(id) ?? false;

                            // Als onRowClick bestaat, wordt de hele rij klikbaar
                            const interactive = Boolean(onRowClick);

                            return (
                                <tr
                                    key={`${id}-${index}`}
                                    className={cx(
                                        interactive && "cursor-pointer",
                                        isSelected && "table-success",
                                    )}
                                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                                >
                                    {/* Checkbox per rij */}
                                    {selectable && (
                                        <td className="text-center">
                                            <input
                                                type="checkbox"
                                                className="form-check-input border-success-subtle"
                                                checked={isSelected}
                                                onClick={(event) => event.stopPropagation()}
                                                onChange={() => selectable.onToggleRow(id)}
                                            />
                                        </td>
                                    )}

                                    {/* Cellen */}
                                    {columns.map((column) => (
                                        <td
                                            key={`${column.key}-${index}`}
                                            className={cx(
                                                column.align === "end" && "text-end",
                                                column.align === "center" && "text-center",
                                            )}
                                        >
                                            {column.render
                                                ? column.render(row)
                                                : ((row as Record<string, ReactNode>)[column.key] ?? "")}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Paginering knoppen */}
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="text-muted small">Pagina {page}</div>

                <div className="btn-group shadow-sm rounded-4 overflow-hidden">
                    <button
                        type="button"
                        className="btn btn-outline-success btn-sm"
                        onClick={() => onPageChange(Math.max(1, page - 1))}
                        disabled={page <= 1}
                    >
                        Vorige
                    </button>
                    <button
                        type="button"
                        className="btn btn-success btn-sm"
                        onClick={() => onPageChange(page + 1)}
                        disabled={!hasNext}
                    >
                        Volgende
                    </button>
                </div>
            </div>
        </div>
    );
}
