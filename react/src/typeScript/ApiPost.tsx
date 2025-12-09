// Let op: GEEN imports van 'react' hier. Dit is een pure hulpfunctie.

export async function UpdateVeilingApi<T>(url: string, changedData: any, token: string | null): Promise<T> {
    
    // 1. Validatie direct uitvoeren
    if (!token) {
        throw new Error("Geen token gevonden. Log opnieuw in.");
    }

    // 2. Fetch uitvoeren
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        // Gebruik direct de parameter, geen tussenstappen met useState
        body: JSON.stringify(changedData)
    });

    // 3. Foutafhandeling
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

    // 4. Resultaat teruggeven
    return await response.json();
}