const datumOpties: Intl.DateTimeFormatOptions = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
};

export function GetDate(time: string, region: string) {
    return new Date(time).toLocaleString(region, datumOpties);
}

export function GetIsoTimeByZone(timeZone: string): string {
    const datum = new Date();

    // Opties om de datum te formatteren
    const options: Intl.DateTimeFormatOptions = {
        timeZone: timeZone, // verandwoordt waar de persoon is in de wereld
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false // 24-uurs klok forceren
    };

    // er wordt gebruikt gemaakt van de locale 'sv-SE' (Zweeds).
    // die gebruiken YY-MM-DD
    const datumString = datum.toLocaleString('sv-SE', options);

    // Vervang de spatie in het midden door een 'T' om het geldig te maken voor de API
    return datumString.replace(' ', 'T');
}