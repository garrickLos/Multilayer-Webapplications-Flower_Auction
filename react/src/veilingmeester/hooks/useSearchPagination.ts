import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';

export type SearchPaginationState = {
    page: number;
    setPage: Dispatch<SetStateAction<number>>;
    pageSize: number;
    setPageSize: (value: number) => void;
    search: string;
    setSearch: (value: string) => void;
    reset: () => void;
};

export function useSearchPagination(
    initialPageSize = 25,
    initialSearch = '',
): SearchPaginationState {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [search, setSearch] = useState(initialSearch);

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
        setSearch(initialSearch);
    }, [initialPageSize, initialSearch]);

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
