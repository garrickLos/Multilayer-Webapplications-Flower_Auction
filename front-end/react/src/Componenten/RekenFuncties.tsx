/**
 * 
 * @param prijs de prijs van centen dat naar euro's moet gaan
 * @param hoeveelheid de hoeveelheid dat door gedeelt moet worden
 * @returns een hoeveelheid in euro's
 */
export function DelenDoor(prijs: number, hoeveelheid: number) {
    return prijs / hoeveelheid;
}

/**
 * 
 * @param prijs de prijs die van centen naar euro's moet gaan
 * @param hoeveelheid de hoeveelheid waarbij het vermenigvuldigd moet worden
 * @returns de hoeveelheid dat wordt teruggestuurd na de berekening
 */
export function Vermenigvuldigen (prijs: number, hoeveelheid: number) {
    return prijs * hoeveelheid;
}