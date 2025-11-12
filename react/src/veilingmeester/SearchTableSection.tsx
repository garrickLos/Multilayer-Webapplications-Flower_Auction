import type { ReactElement, ReactNode } from "react";
import type { ApiError } from "./api";
import { DataTable, type Column } from "./DataTable";
import { InlineAlert, Loading, Pager, SearchInput, SelectSm } from "./components";

export type SearchFieldProps = {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    columnClassName?: string;
};

export type PageSizeFieldProps = {
    id: string;
    label: string;
    value: number;
    onChange: (value: number) => void;
    columnClassName?: string;
};

type PaginationProps = {
    page: number;
    setPage: (page: number) => void;
    hasNext: boolean;
    loading: boolean;
    total?: number;
};

type SearchTableSectionProps<T> = {
    panelId: string;
    tabId: string;
    hidden: boolean;
    rows: readonly T[];
    columns: ReadonlyArray<Column<T>>;
    tableCaption?: string;
    tableEmpty?: ReactNode;
    loading: boolean;
    error: ApiError | null;
    search?: SearchFieldProps;
    pageSize: PageSizeFieldProps;
    extraFilterColumns?: ReactNode;
    filterChips?: ReactNode;
    onRowClick?: (row: T) => void;
    getRowKey: (row: T, index: number) => string;
    pagination: PaginationProps;
};

export function SearchTableSection<T>({
    panelId,
    tabId,
    hidden,
    rows,
    columns,
    tableCaption,
    tableEmpty,
    loading,
    error,
    search,
    pageSize,
    extraFilterColumns,
    filterChips,
    onRowClick,
    getRowKey,
    pagination,
}: SearchTableSectionProps<T>): ReactElement {
    const hasError = Boolean(error);
    const resultCountId = `${panelId}-results`;

    return (
        <section
            id={panelId}
            role="tabpanel"
            tabIndex={0}
            aria-labelledby={tabId}
            hidden={hidden}
            className="card shadow-sm border-0"
            aria-busy={loading}
        >
            <div className="card-body">
                <div className="row g-3 align-items-end">
                    {search && (
                        <SearchInput
                            id={search.id}
                            label={search.label}
                            value={search.value}
                            onChange={search.onChange}
                            placeholder={search.placeholder}
                            className={search.columnClassName ?? "col-12 col-md-6"}
                        />
                    )}
                    <SelectSm<number>
                        id={pageSize.id}
                        label={pageSize.label}
                        value={pageSize.value}
                        onChange={(value) => pageSize.onChange(value)}
                        options={[
                            { value: 10, label: "10" },
                            { value: 25, label: "25" },
                            { value: 50, label: "50" },
                        ]}
                        className={pageSize.columnClassName ?? "col-12 col-md-3"}
                        parse={(raw) => Number(raw) as number}
                    />
                    {extraFilterColumns}
                </div>

                {filterChips && <div className="d-flex flex-wrap gap-2 mt-3">{filterChips}</div>}

                <div className="mt-3" aria-live="polite" id={resultCountId}>
                    {loading ? "Laden…" : `${rows.length === 1 ? "1 resultaat" : `${rows.length} resultaten`}`}
                </div>

                {hasError && (
                    <InlineAlert id={`${panelId}-error`}>
                        {error?.message || "Er ging iets mis."}
                    </InlineAlert>
                )}

                <div className="mt-3">
                    {loading && !rows.length && !hasError && <Loading />}
                    {!loading && !rows.length && !hasError && tableEmpty}
                    {rows.length > 0 && (
                        <DataTable
                            columns={columns}
                            rows={rows}
                            caption={tableCaption}
                            empty={tableEmpty}
                            onRowClick={onRowClick}
                            getRowKey={getRowKey}
                        />
                    )}
                </div>

                <Pager
                    page={pagination.page}
                    pageSize={pageSize.value}
                    rowCount={rows.length}
                    totalResults={pagination.total}
                    hasNext={pagination.hasNext}
                    loading={pagination.loading}
                    onPrev={() => pagination.setPage(Math.max(1, pagination.page - 1))}
                    onNext={() => pagination.setPage(pagination.page + 1)}
                />
            </div>
        </section>
    );
}
