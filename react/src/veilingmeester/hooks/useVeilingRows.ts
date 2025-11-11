import { useCallback } from 'react';
import { DEFAULT_PAGE_SIZE } from '../config';
import { useSearchTableSection } from './useSearchTableSection';
import { formatCurrency, formatDateTime } from '../utils/format';
import type { Veiling, VeilingRow } from '../types';

export function useVeilingRows() {
    const mapRow = useCallback(
        (row: Veiling, index: number): VeilingRow => ({
            id: row.veilingNr ?? index,
            veilingNr: row.veilingNr,
            begintijd: formatDateTime(row.begintijd),
            eindtijd: formatDateTime(row.eindtijd),
            status: row.status ?? undefined,
            minimumprijs: formatCurrency(row.minimumprijs),
            aantalProducten: Array.isArray(row.producten)
                ? row.producten.length
                : 0,
        }),
        [],
    );

    return useSearchTableSection<Veiling, VeilingRow>({
        initialPageSize: DEFAULT_PAGE_SIZE,
        fetch: {
            path: '/api/Veiling',
            paramsKey: 'auctions|all',
            refreshMs: 5_000,
            revalidateOnFocus: true,
        },
        mapRow,
        errorMessage: 'Kon veilingen niet laden',
    });
}
