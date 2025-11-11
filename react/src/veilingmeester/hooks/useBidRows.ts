import { useCallback } from 'react';
import { DEFAULT_PAGE_SIZE } from '../config';
import { useLiveNameCache } from './useLiveNameCache';
import { useSearchTableSection } from './useSearchTableSection';
import type { BidRow, Bieding } from '../types/types.ts';

export function useBidRows() {
    const { gebruikersMap, veilingenMap, fetchGebruikers, fetchVeilingen } =
        useLiveNameCache();

    const handleSourceChange = useCallback(
        (rows: readonly Bieding[]) => {
            if (!rows.length) return;

            const gebruikerIds = new Set<number>();
            const veilingIds = new Set<number>();

            rows.forEach(row => {
                if (typeof row.gebruikerNr === 'number') {
                    gebruikerIds.add(row.gebruikerNr);
                }
                if (typeof row.veilingNr === 'number') {
                    veilingIds.add(row.veilingNr);
                }
            });

            if (gebruikerIds.size) fetchGebruikers([...gebruikerIds]);
            if (veilingIds.size) fetchVeilingen([...veilingIds]);
        },
        [fetchGebruikers, fetchVeilingen],
    );

    const mapRow = useCallback(
        (row: Bieding, index: number): BidRow => {
            const gebruikerNr = row.gebruikerNr;
            const veilingNr = row.veilingNr;

            return {
                id: row.biedNr ?? index,
                biedNr: row.biedNr ?? '',
                gebruiker:
                    gebruikerNr != null
                        ? gebruikersMap[gebruikerNr] ?? gebruikerNr
                        : '',
                veiling:
                    veilingNr != null ? veilingenMap[veilingNr] ?? veilingNr : '',
                bedragPerFust: row.bedragPerFust ?? '',
                aantalStuks: row.aantalStuks ?? '',
            };
        },
        [gebruikersMap, veilingenMap],
    );

    return useSearchTableSection<Bieding, BidRow>({
        initialPageSize: DEFAULT_PAGE_SIZE,
        fetch: {
            path: '/api/Bieding',
            paramsKey: 'bids|all',
            refreshMs: 1_000,
            revalidateOnFocus: true,
        },
        mapRow,
        errorMessage: 'Kon biedingen niet laden',
        onSourceChange: handleSourceChange,
    });
}
