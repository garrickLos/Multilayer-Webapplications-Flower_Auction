export interface MyTokenPayload {
    GebruikerNr: string; // Of number, afhankelijk van je API
    expiration: number; // wanneer de token verloopt
    IssuedAt: number; // de datum dat het is vrij gegeven
    [key: string]: any; // Voor overige onbekende velden
}