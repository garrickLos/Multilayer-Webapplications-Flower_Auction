/**
 * Voor het makkelijk ophalen van de token uit de sessionStorage zodat er geen fouten gemaakt kunnen worden makkelijk vervangen
 * @returns de jwt token uit de sessionStorage
 */
export function getBearerToken() {
    let token = sessionStorage.getItem("token");

    if (token === null) {
        token = "";
    }

    return token;
}

/**
 * Voor het makkelijk ophalen van de refreshtoken uit de sessionstorage en zodat er geen fouten gemaakt worden met het ophalen
 * Ook voor het makkelijk editen in de toekomst
 * @returns de refreshToken uit de sessionstorage
 */
export function getRefreshToken(){
    return sessionStorage.getItem("refreshToken")
}