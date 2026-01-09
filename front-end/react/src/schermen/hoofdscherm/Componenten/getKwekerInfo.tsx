// api import
import { ApiRequest } from "../../../typeScript/ApiRequest";

import type { KwekerInfo } from '../../hoofdscherm/Componenten/index';

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