export async function ApiRequest<T>(
    url: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE', 
    data: any | null, token: string | null, refreshToken: string | null
    ): Promise<T> {

    if (!isValidToken(token)) {
        throw new Error("Geen geldig token gevonden.");
    }

    let response = await RequestFetch(url, method, data, token as string); 

    if (response.status === 401 && refreshToken) {
        try {
            // haalt een nieuwe refreshToken op als er een error is van 401
            const nieuweTokens = await TokenRefresh(token as string, refreshToken);

            // zet de nieuwe tokens in de session storage
            sessionStorage.setItem("token", nieuweTokens.token);
            sessionStorage.setItem("refreshToken", nieuweTokens.refreshToken);

            response = await RequestFetch(url, method, data, nieuweTokens.token);

        } catch (error) {
            // logt de gebruiker zogezegd uit als de refresh mislukt is
            sessionStorage.removeItem("token"); //  verwijderd de normale token die in de session storage staat
            sessionStorage.removeItem("refreshToken"); // verwijderd de refreshToken die in de session storage staat
            console.log("Nieuwe error: " + error);
            throw new Error('Sessie is verlopen. Log opnieuw in');
        }
    }

    // geeft een error terug wanneer de response fout is
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error (errorData.detail || `Request mislukt: ${response.status}`);
    }

    return await response.json();
}

async function RequestFetch(url: string, method: string, data: any, token: string): Promise <Response> {
    const headers: HeadersInit = {
        'Content-type': 'application/json',
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        method: method,
        headers: headers
    };

    // indien de methode geen "GET" is dan geeft het de data een body om mee te versturen
    if (method !== 'GET' && data !== null) {
        config.body = JSON.stringify(data);
    }

    return await fetch(url, config);
}

// checked of de token die gebruikt wordt ook echt goed in elkaar zit
function isValidToken(token: string | null): boolean {
    return !sessionStorage.getItem('token') || token !== "null" && token !== "undefined";
}

async function TokenRefresh(token: string, refreshToken: string): Promise <{ token: string, refreshToken: string }> {
    // url voor de refreshToken api
    const refreshUrl = "/api/Auth/refresh";
    
    // is vaak een post om te refreshToken te pakken
    const response = await fetch(refreshUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'},
            body: JSON.stringify({ token, refreshToken })
        });
    
    if (!response.ok) {
        throw new Error('Refresh mislukt');
    }

    return await response.json();
}