import type { RowBase } from '../types/types.ts';
import { useSearchPagination, type SearchPaginationState } from './useSearchPagination';
import {
    useSearchableLiveRows,
    type UseSearchableLiveRowsOptions,
    type SearchableLiveRowsResult,
} from './useSearchableLiveRows';

type InternalOptions<TSource, TRow extends RowBase> = Omit<
    UseSearchableLiveRowsOptions<TSource, TRow>,
    'page' | 'pageSize' | 'query'
>;

export type SearchTableSectionResult<TSource, TRow extends RowBase> =
    SearchPaginationState & SearchableLiveRowsResult<TSource, TRow>;

export type UseSearchTableSectionOptions<TSource, TRow extends RowBase> = InternalOptions<
    TSource,
    TRow
> & {
    initialPageSize?: number;
    initialSearch?: string;
};

export function useSearchTableSection<TSource, TRow extends RowBase>(
    options: UseSearchTableSectionOptions<TSource, TRow>,
): SearchTableSectionResult<TSource, TRow> {
    const {
        initialPageSize = 25,
        initialSearch = '',
        debounceMs = 350,
        ...rest
    } = options;

    const pagination = useSearchPagination(initialPageSize, initialSearch);

    const result = useSearchableLiveRows<TSource, TRow>({
        ...rest,
        page: pagination.page,
        pageSize: pagination.pageSize,
        query: pagination.search,
        debounceMs,
    });

    return {
        ...pagination,
        ...result,
    };
}
