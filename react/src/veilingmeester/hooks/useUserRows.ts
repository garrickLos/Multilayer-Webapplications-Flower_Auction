import { useCallback } from 'react';
import { DEFAULT_PAGE_SIZE } from '../config';
import { useSearchTableSection } from './useSearchTableSection';
import type { User, UserRow } from '../types/types.ts';

const toDisplayName = (row: User, fallback: string): string => {
    const naam = typeof row.naam === 'string' ? row.naam.trim() : '';
    return naam || fallback;
};

export function useUserRows() {
    const mapRow = useCallback(
        (row: User, index: number): UserRow => {
            const gebruikerNr = row.gebruikerNr;
            const id = gebruikerNr ?? index;
            const fallbackNaam = `Gebruiker ${gebruikerNr ?? index + 1}`;
            const naam = toDisplayName(row, fallbackNaam);
            const email = typeof row.email === 'string' ? row.email.trim() : '';
            const status = typeof row.status === 'string' ? row.status.trim() : '';

            let rol = '';
            if (Array.isArray(row.rollen)) {
                rol = row.rollen
                    .map(value => (typeof value === 'string' ? value.trim() : ''))
                    .filter(Boolean)
                    .join(', ');
            } else if (typeof row.rol === 'string') {
                rol = row.rol.trim();
            }

            return {
                id,
                gebruikerNr: gebruikerNr ?? '',
                naam,
                email,
                status,
                rol,
            };
        },
        [],
    );

    return useSearchTableSection<User, UserRow>({
        initialPageSize: DEFAULT_PAGE_SIZE,
        fetch: {
            path: '/api/Gebruiker',
            paramsKey: 'users|all',
            refreshMs: 30_000,
            revalidateOnFocus: true,
        },
        mapRow,
        errorMessage: 'Kon gebruikers niet laden',
    });
}
