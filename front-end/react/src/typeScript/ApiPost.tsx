export async function UpdateVeilingApi<T>(url: string, changedData: T, token: string | null): Promise<T> {
    
    if (!token) {
        throw new Error("Geen token gevonden. Log opnieuw in.");
    }

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        // Gebruik direct de parameter, geen tussenstappen met useState
        body: JSON.stringify(changedData)
    });

    if (!response.ok) {
        let foutmelding = 'Er ging iets mis bij het updaten';
        
        try {
            const errorData = await response.json();
            // Probeer specifieke foutmeldingen uit te lezen
            foutmelding = errorData.detail || errorData.title || JSON.stringify(errorData);
        } catch (e) {
            foutmelding = `Server gaf status: ${response.status}`;
        }
        
        throw new Error(foutmelding);
    }

    return await response.json();
}

export async function UpdateApi<T>(
    url: string, 
    changedData: T, 
    token: string | null, 
    refreshToken: string | null
): Promise<T> {
    
    if (!token) {
        throw new Error("Geen token gevonden. Log opnieuw in.");
    }

    // Interne functie om de request uit te voeren met een specifieke token
    const makeRequest = async (authToken: string) => {
        return await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(changedData)
        });
    };

    let response = await makeRequest(token);

    // Als de token verlopen is (401), probeer te refreshen
    if (response.status === 401 && refreshToken) {
        const refreshUrl = url; // Pas aan naar jouw API URL

        const refreshResponse = await fetch(refreshUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: token,
                refreshToken: refreshToken
            })
        });

        if (refreshResponse.ok) {
            const newTokens = await refreshResponse.json();
            
            // Sla de nieuwe tokens op in de lokale opslag
            localStorage.setItem("token", newTokens.token);
            localStorage.setItem("refreshToken", newTokens.refreshToken);

            // Probeer het oorspronkelijke verzoek opnieuw met de nieuwe token
            response = await makeRequest(newTokens.token);
        } else {
            // Refresh token is ook ongeldig
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            throw new Error("Sessie verlopen. Log opnieuw in.");
        }
    }

    if (!response.ok) {
        let foutmelding = 'Er ging iets mis bij het updaten';
        try {
            const errorData = await response.json();
            foutmelding = errorData.detail || errorData.title || JSON.stringify(errorData);
        } catch (e) {
            foutmelding = `Server gaf status: ${response.status}`;
        }
        throw new Error(foutmelding);
    }

    return await response.json();
}