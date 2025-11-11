import { useCallback, useState } from 'react';

export function useSearchPagination(initialPageSize = 25) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [search, setSearch] = useState('');

    const updateSearch = useCallback((value: string) => {
        setPage(1);
        setSearch(value);
    }, []);

    const updatePageSize = useCallback((value: number) => {
        setPage(1);
        setPageSize(value);
    }, []);

    const reset = useCallback(() => {
        setPage(1);
        setPageSize(initialPageSize);
        setSearch('');
    }, [initialPageSize]);

    return {
        page,
        setPage,
        pageSize,
        setPageSize: updatePageSize,
        search,
        setSearch: updateSearch,
        reset,
    };
}
