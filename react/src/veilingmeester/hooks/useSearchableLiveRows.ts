import { useEffect, useMemo } from 'react';
import { useLivePagedList } from '../data/live';
import type { Query } from '../data/utils';
import type { RowBase } from '../types';
import { useDebouncedValue } from './useDebouncedValue';
import { splitSearchTokens, rowToSearchString, matchesSearchTokens } from '../utils/search';
import { toErrorMessage } from '../utils/errors';

export type SearchableLiveRowsResult<TSource, TRow extends RowBase> = {
    rows: readonly TRow[];
    loading: boolean;
    error: string | null;
    hasNext: boolean;
    sourceRows: readonly TSource[];
};

export type UseSearchableLiveRowsOptions<TSource, TRow extends RowBase> = {
    page: number;
    pageSize: number;
    query: string;
    fetch: {
        path: string;
        paramsKey: string;
        params?: Query;
        refreshMs?: number;
        revalidateOnFocus?: boolean;
        init?: RequestInit;
    };
    mapRow: (
        source: TSource,
        index: number,
        list: readonly TSource[],
    ) => TRow;
    errorMessage: string;
    debounceMs?: number;
    onSourceChange?: (rows: readonly TSource[]) => void;
    getSearchValue?: (row: TRow, source: TSource) => string;
};

export function useSearchableLiveRows<TSource, TRow extends RowBase>(
    options: UseSearchableLiveRowsOptions<TSource, TRow>,
): SearchableLiveRowsResult<TSource, TRow> {
    const {
        page,
        pageSize,
        query,
        fetch,
        mapRow,
        errorMessage,
        debounceMs,
        onSourceChange,
        getSearchValue,
    } = options;

    const debouncedQuery = useDebouncedValue(query, debounceMs);

    const { data, loading, error, lastCount } = useLivePagedList<TSource>({
        path: fetch.path,
        params: fetch.params,
        page,
        pageSize,
        paramsKey: fetch.paramsKey,
        init: fetch.init,
        refreshMs: fetch.refreshMs,
        revalidateOnFocus: fetch.revalidateOnFocus,
    });

    const sourceRows = useMemo(
        () => (Array.isArray(data) ? (data as readonly TSource[]) : []),
        [data],
    );

    useEffect(() => {
        onSourceChange?.(sourceRows);
    }, [sourceRows, onSourceChange]);

    const mappedRows = useMemo(
        () =>
            sourceRows.map((item, index) => {
                const row = mapRow(item, index, sourceRows);
                const searchValue = getSearchValue
                    ? getSearchValue(row, item)
                    : rowToSearchString(row as Record<string, unknown>);
                return { row, searchValue };
            }),
        [sourceRows, mapRow, getSearchValue],
    );

    const tokens = useMemo(
        () => splitSearchTokens(debouncedQuery),
        [debouncedQuery],
    );

    const rows = useMemo(() => {
        if (!tokens.length) return mappedRows.map(item => item.row);
        return mappedRows
            .filter(item => matchesSearchTokens(item.searchValue, tokens))
            .map(item => item.row);
    }, [mappedRows, tokens]);

    const hasNext = (lastCount ?? 0) >= pageSize;

    return {
        rows,
        loading,
        error: toErrorMessage(error, errorMessage),
        hasNext,
        sourceRows,
    };
}
