// api import
import { ApiRequest } from '../../../Componenten/index';

import type { KwekerInfo } from '../../hoofdscherm/Componenten/index';

/**
 * 
 * @param gebruikerNr Is het nummer van de gebruiker die gebruikt wordt om informatie op te zoeken
 * @returns data die de kweker informatie opvult voor de veilingkaart op de hoofdpagina
 */
export async function getKwekerInfo(gebruikerNr: number) {
    const aanvoerderUrl: string = `/api/Gebruiker/kwekerNaam?GebruikerNr=${gebruikerNr}`;

    try {
        // haalt de kwekerInfo op (anonymous) om de naam op te halen.
        const data = await ApiRequest<KwekerInfo>(aanvoerderUrl, "GET", null, null, null);

        return data;
    } catch (error: any) {
        // error handling
        console.error(error.message);
    }
}