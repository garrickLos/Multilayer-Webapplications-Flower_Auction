import { useMemo } from 'react';
import { useLiveData } from '../data/live';
import { formatCurrency, parseLocaleNumber } from '../utils/format';
import { toErrorMessage } from '../utils/errors';
import type { RowBase, Veiling, VeilingProductItem } from '../types/types.ts';

export type VeilingProductRow = RowBase & {
    id: number | string;
    veilingProductNr: number | '';
    naam: string;
    startprijs: string;
    startprijsValue: number;
    voorraad: number | '';
    afbeeldingUrl?: string;
    imageOrClock?: null;
};

export type VeilingDetail = Veiling & {
    producten?: VeilingProductItem[] | null;
    minimumprijs: number | string;
};

export function useVeilingProducts(veilingId: number) {
    const { data: veiling, error } = useLiveData<VeilingDetail>(
        `/api/Veiling/${veilingId}`,
        { refreshMs: 5_000, revalidateOnFocus: true },
    );

    const rows = useMemo<VeilingProductRow[]>(
        () =>
            veiling?.producten?.map((product, index) => {
                const startprijsValue = parseLocaleNumber(product?.startprijs ?? 0);
                const naam = (product?.naam ?? '').toString().trim();

                return {
                    id: product?.veilingProductNr ?? index,
                    veilingProductNr: product?.veilingProductNr ?? '',
                    naam,
                    startprijs: formatCurrency(startprijsValue),
                    startprijsValue,
                    voorraad: product?.voorraad ?? '',
                    afbeeldingUrl: (product as { afbeeldingUrl?: string | null })?.afbeeldingUrl ?? undefined,
                    imageOrClock: null,
                } satisfies VeilingProductRow;
            }) ?? [],
        [veiling],
    );

    return {
        veiling,
        rows,
        loading: !veiling && !error,
        errorMessage: toErrorMessage(error, 'Kon veiling niet ophalen.'),
    } as const;
}
