import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebouncedValue } from './useDebouncedValue';
import { usePagedList } from '../data/live';
import { useLiveNameCache } from './useLiveNameCache';
import { formatDateTime } from '../utils/format';
import { toErrorMessage } from '../utils/errors';
import type { Bieding, UserBidRow } from '../types/types.ts';

export type UserBidFilters = {
    q?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
};

const DEFAULT_PAGE_SIZE_MODAL = 10;

const toDateValue = (row: Bieding): string => {
    const candidates: Array<unknown> = [
        (row as Record<string, unknown>).datum,
        (row as Record<string, unknown>).aanmaakDatum,
        (row as Record<string, unknown>).aangemaaktOp,
        (row as Record<string, unknown>).createdAt,
        (row as Record<string, unknown>).updatedAt,
    ];

    for (const value of candidates) {
        if (typeof value === 'string' && value.trim()) {
            return value;
        }
        if (value instanceof Date) {
            return value.toISOString();
        }
    }

    return '';
};

export function useUserBids(
    userId: string | number,
    filters: UserBidFilters = {},
): {
    rows: readonly UserBidRow[];
    loading: boolean;
    error: string | null;
    page: number;
    setPage: (value: number | ((prev: number) => number)) => void;
    pageSize: number;
    setPageSize: (value: number) => void;
    hasNext: boolean;
    search: string;
    setSearch: (value: string) => void;
    status: string;
    setStatus: (value: string) => void;
    from: string;
    setFrom: (value: string) => void;
    to: string;
    setTo: (value: string) => void;
    statusOptions: readonly string[];
    reset: () => void;
} {
    const [search, setSearch] = useState(filters.q ?? '');
    const [status, setStatus] = useState(filters.status ?? 'alle');
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');
    const [page, setPage] = useState(filters.page ?? 1);
    const [pageSize, setPageSizeRaw] = useState(filters.pageSize ?? DEFAULT_PAGE_SIZE_MODAL);

    const debouncedSearch = useDebouncedValue(search, 350);

    const params = useMemo(
        () => ({
            q: debouncedSearch || undefined,
            status: status && status !== 'alle' ? status : undefined,
            from: from || undefined,
            to: to || undefined,
        }),
        [debouncedSearch, status, from, to],
    );

    const paramsKey = useMemo(
        () =>
            [
                'user-bids',
                userId,
                debouncedSearch || '',
                status || 'alle',
                from || '',
                to || '',
            ].join('|'),
        [userId, debouncedSearch, status, from, to],
    );

    const { data, loading, error, lastCount } = usePagedList<Bieding>({
        path: `/api/Gebruiker/${userId}/Bieding`,
        params,
        page,
        pageSize,
        paramsKey,
    });

    const { veilingenMap, fetchVeilingen } = useLiveNameCache();

    useEffect(() => {
        if (!data.length) return;
        const ids = new Set<number>();
        data.forEach(row => {
            if (typeof row.veilingNr === 'number') {
                ids.add(row.veilingNr);
            }
        });
        if (ids.size) {
            fetchVeilingen([...ids]);
        }
    }, [data, fetchVeilingen]);

    const rows = useMemo<ReadonlyArray<UserBidRow>>(
        () =>
            data.map((row, index) => {
                const biedNr = row.biedNr ?? index;
                const veilingNr = row.veilingNr;
                const veiling =
                    veilingNr != null ? veilingenMap[veilingNr] ?? veilingNr : '';

                const datumRaw = toDateValue(row);

                const bedrag = row.bedragPerFust ?? '';
                const aantal = row.aantalStuks ?? '';

                const statusLabel =
                    typeof (row as Record<string, unknown>).status === 'string'
                        ? ((row as Record<string, unknown>).status as string).trim()
                        : '';

                return {
                    id: biedNr ?? index,
                    biedNr: biedNr ?? '',
                    veiling,
                    veilingNr: veilingNr ?? '',
                    bedragPerFust: bedrag,
                    aantalStuks: aantal,
                    status: statusLabel,
                    datum: formatDateTime(datumRaw),
                } satisfies UserBidRow;
            }),
        [data, veilingenMap],
    );

    const statusOptions = useMemo(() => {
        const set = new Set<string>();
        rows.forEach(row => {
            if (row.status) {
                set.add(row.status);
            }
        });
        const sorted = Array.from(set).sort((a, b) =>
            a.localeCompare(b, 'nl-NL', { sensitivity: 'base' }),
        );
        return ['alle', ...sorted];
    }, [rows]);

    const hasNext = lastCount >= pageSize;

    const setSearchValue = useCallback(
        (value: string) => {
            setPage(1);
            setSearch(value);
        },
        [setPage, setSearch],
    );

    const setStatusValue = useCallback(
        (value: string) => {
            setPage(1);
            setStatus(value);
        },
        [setPage, setStatus],
    );

    const setFromValue = useCallback(
        (value: string) => {
            setPage(1);
            setFrom(value);
        },
        [setPage, setFrom],
    );

    const setToValue = useCallback(
        (value: string) => {
            setPage(1);
            setTo(value);
        },
        [setPage, setTo],
    );

    const setPageSize = useCallback(
        (value: number) => {
            setPage(1);
            setPageSizeRaw(value);
        },
        [setPage],
    );

    const reset = useCallback(() => {
        setSearch('');
        setStatus('alle');
        setFrom('');
        setTo('');
        setPage(1);
        setPageSizeRaw(filters.pageSize ?? DEFAULT_PAGE_SIZE_MODAL);
    }, [filters.pageSize, setPage, setSearch, setStatus, setFrom, setTo]);

    const errorMessage = useMemo(
        () => toErrorMessage(error, 'Kon biedingen niet laden'),
        [error],
    );

    return {
        rows,
        loading,
        error: errorMessage,
        page,
        setPage,
        pageSize,
        setPageSize,
        hasNext,
        search,
        setSearch: setSearchValue,
        status,
        setStatus: setStatusValue,
        from,
        setFrom: setFromValue,
        to,
        setTo: setToValue,
        statusOptions,
        reset,
    };
}
