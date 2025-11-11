import type { Dispatch, ReactNode, SetStateAction } from 'react';
import DataTable, { type DataTableProps } from './DataTable';
import { SearchInput, SelectSm, Loading, Empty, Pager } from './components';
import type { RowBase } from '../types/types.ts';

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
    values?: readonly number[];
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
    extraFilterColumns?: ReactNode;
    emptyState?: ReactNode;
    tableProps?: Omit<DataTableProps<T>, 'rows'>;
    children?: ReactNode;
};

const baseClass = 'card border-0 shadow-sm rounded-4';

export default function SearchTableSection<T extends RowBase>({
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
    const sectionClass = className ? `${baseClass} ${className}` : baseClass;
    const bodyClass = bodyClassName ? `card-body ${bodyClassName}` : 'card-body';
    const ps = pageSize;

    return (
        <section
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId}
            hidden={hidden}
            className={sectionClass}
        >
            <div className={bodyClass}>
                <div className="row g-2 align-items-end mb-2">
                    <div className={search.columnClassName ?? 'col-12 col-md-8'}>
                        <SearchInput
                            id={search.id}
                            label={search.label}
                            value={search.value}
                            onChange={search.onChange}
                            placeholder={search.placeholder}
                        />
                    </div>
                    <div className={ps.columnClassName ?? 'col-12 col-md-4'}>
                        <SelectSm
                            id={ps.id}
                            label={ps.label}
                            value={ps.value}
                            values={ps.values}
                            onChange={ps.onChange}
                        />
                    </div>
                    {extraFilterColumns}
                </div>

                {filterChips && (
                    <div className="d-flex flex-wrap gap-2 mb-2">{filterChips}</div>
                )}

                {error ? (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                ) : loading ? (
                    <Loading />
                ) : rows.length ? (
                    <DataTable rows={rows} {...(tableProps || {})} />
                ) : (
                    emptyState ?? <Empty />
                )}

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
