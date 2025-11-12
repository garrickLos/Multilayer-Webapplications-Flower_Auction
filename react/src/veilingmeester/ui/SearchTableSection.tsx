import {
    memo,
    useMemo,
    type Dispatch,
    type ReactNode,
    type SetStateAction,
    type ReactElement,
} from "react";
import DataTable, { type DataTableProps } from "./DataTable";
import { SearchInput, SelectSm, Loading, Empty, Pager } from "./components";
import type { RowBase } from "../types/types.ts";

/* util */
const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

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
    value: number;
    onChange: (value: number) => void;
    label?: string;
    /** Opties voor page size; heet 'options' om te matchen met <SelectSm> */
    options?: readonly number[];
    columnClassName?: string;
};

export type PaginationControls = {
    page: number;
    setPage: Dispatch<SetStateAction<number>>;
    hasNext: boolean;
    loading?: boolean;
    total?: number;
};

export type SearchTableSectionProps<T extends RowBase> = {
    panelId: string;
    tabId: string;
    hidden?: boolean;
    className?: string;
    bodyClassName?: string;
    search: SearchFieldProps;
    pageSize: PageSizeFieldProps;
    rows: readonly T[];
    loading: boolean;
    error?: string | null;
    pagination: PaginationControls;
    filterChips?: ReactNode;
    /** Plaats extra filterkolommen naast search/pageSize (bv. status dropdowns) */
    extraFilterColumns?: ReactNode;
    emptyState?: ReactNode;
    /** Props voor DataTable; 'rows' wordt altijd uit props.rows gehaald */
    tableProps?: Omit<DataTableProps<T>, "rows">;
    children?: ReactNode;
};

const BASE_CLASS = "card border-0 shadow-sm rounded-4";

function SearchTableSectionInner<T extends RowBase>({
                                                        panelId,
                                                        tabId,
                                                        hidden = false,
                                                        className,
                                                        bodyClassName,
                                                        search,
                                                        pageSize,
                                                        rows,
                                                        loading,
                                                        error,
                                                        pagination,
                                                        filterChips,
                                                        extraFilterColumns,
                                                        emptyState,
                                                        tableProps,
                                                        children,
                                                    }: SearchTableSectionProps<T>) {
    const sectionClass = useMemo(() => cx(BASE_CLASS, className), [className]);
    const bodyClass = useMemo(() => cx("card-body", bodyClassName), [bodyClassName]);

    const hasRows = rows.length > 0;
    const isBusy = loading && !error;

    // Veilig: nooit 'rows' vanuit tableProps propagaten
    const safeTableProps = tableProps as DataTableProps<T> | undefined;

    return (
        <section
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId}
            aria-hidden={hidden || undefined}
            hidden={hidden}
            className={sectionClass}
            aria-busy={isBusy || undefined}
        >
            <div className={bodyClass}>
                {/* Filters */}
                <div className="row g-2 align-items-end mb-2" aria-live="polite">
                    <div className={search.columnClassName ?? "col-12 col-md-8"}>
                        <SearchInput
                            id={search.id}
                            label={search.label}
                            value={search.value}
                            onChange={search.onChange}
                            placeholder={search.placeholder}
                            className="mb-0"
                        />
                    </div>

                    <div className={pageSize.columnClassName ?? "col-12 col-md-4"}>
                        <SelectSm
                            id={pageSize.id}
                            label={pageSize.label}
                            value={pageSize.value}
                            options={pageSize.options}
                            onChange={pageSize.onChange}
                        />
                    </div>

                    {extraFilterColumns}
                </div>

                {filterChips && <div className="d-flex flex-wrap gap-2 mb-2">{filterChips}</div>}

                {/* Content */}
                {error ? (
                    <div className="alert alert-danger" role="alert" aria-live="assertive">
                        {error}
                    </div>
                ) : loading ? (
                    <Loading />
                ) : hasRows ? (
                    <DataTable rows={rows} {...safeTableProps} />
                ) : (
                    (emptyState ?? <Empty />)
                )}

                {/* Paginering */}
                <Pager
                    page={pagination.page}
                    setPage={pagination.setPage}
                    hasNext={pagination.hasNext}
                    loading={pagination.loading ?? loading}
                    total={pagination.total ?? rows.length}
                />
            </div>

            {children}
        </section>
    );
}

// Generics behouden met memo + juiste return type (ReactElement i.p.v. JSX.Element)
const SearchTableSection = memo(
    SearchTableSectionInner
) as <T extends RowBase>(props: SearchTableSectionProps<T>) => ReactElement;

export default SearchTableSection;
