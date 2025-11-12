import { useCallback, useMemo, useState } from 'react';
import { DEFAULT_PAGE_SIZE } from '../config';
import { useSearchTableSection } from './useSearchTableSection';
import { formatDateTime } from '../utils/format';
import type { Veiling, VeilingRow } from '../types/types.ts';

export function useVeilingRows() {
    const [status, setStatusValue] = useState<'alle' | 'actief' | 'inactief'>('alle');

    const mapRow = useCallback(
        (row: Veiling, index: number): VeilingRow => ({
            id: row.veilingNr ?? index,
            veilingNr: row.veilingNr,
            begintijd: formatDateTime(row.begintijd),
            eindtijd: formatDateTime(row.eindtijd),
            status: row.status ?? undefined,
            aantalProducten: Array.isArray(row.producten)
                ? row.producten.length
                : 0,
        }),
        [],
    );

    const fetchOptions = useMemo(
        () => ({
            path: '/api/Veiling',
            paramsKey: `auctions|status:${status}`,
            params: status === 'alle' ? undefined : { status },
            refreshMs: 5_000,
            revalidateOnFocus: true,
        }),
        [status],
    );

    const table = useSearchTableSection<Veiling, VeilingRow>({
        initialPageSize: DEFAULT_PAGE_SIZE,
        fetch: fetchOptions,
        mapRow,
        errorMessage: 'Kon veilingen niet laden',
    });

    const { setPage } = table;
    const baseReset = table.reset;

    const updateStatus = useCallback(
        (value: 'alle' | 'actief' | 'inactief') => {
            setStatusValue(value);
            setPage(1);
        },
        [setPage],
    );
    const reset = useCallback(() => {
        setStatusValue('alle');
        baseReset();
    }, [baseReset]);

    return { ...table, status, setStatus: updateStatus, reset };
}
