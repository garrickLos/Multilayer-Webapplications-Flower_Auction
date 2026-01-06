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