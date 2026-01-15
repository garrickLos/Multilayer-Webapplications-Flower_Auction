// Payload dat naar de API wordt gestuurd bij het aanmaken/updaten van een veiling
export type AuctionPayload = {
    title: string;    // Titel/naam van de veiling
    startIso: string; // Starttijd als ISO string (bijv. 2026-01-14T10:00)
    endIso: string;   // Eindtijd als ISO string (bijv. 2026-01-14T12:00)
};

import type { AuctionDurationHours } from "./rules";

// Interne form state voor de "Nieuwe veiling" modal (UI velden)
export type AuctionFormState = {
    title: string;                  // Ingevulde titel in het formulier
    date: string;                   // Datumveld (YYYY-MM-DD)
    startTime: string;              // Starttijdveld (HH:mm)
    durationHours: AuctionDurationHours; // Gekozen duur (1, 2 of 3 uur)
};
