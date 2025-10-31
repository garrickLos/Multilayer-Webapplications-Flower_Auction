async function genereerDataItem(containerId, divClass, jsonItem, url) {
    const container = document.getElementById(containerId);

    if (!container) {
        console.error('Fout by het vinden van de id: '+
            'de container met het id "${containerId}" niet gevonden');
            return;
    }

    const jsonArray = await dataOphalen(jsonItem, url);

    if (!jsonArray || jsonArray.length === 0) {
        console.warn('Geen deals gevonden of er is een fout opgetreden bij het ophalen.');
        return;
    }
    
    jsonArray.forEach(itemInfo => {         
            const itemcontainer = document.createElement('div');
            itemcontainer.classList.add(divClass);  
            const ImagePath = itemInfo.imagePath || '/front-end/resources/pictures/webp/MissingPicture.webp';
            const altText = itemInfo["afbeelding-alt"] || "Afbeelding van het item";
            const headerText = itemInfo.header_info || "Geen Titel";
            const paragraafTekst = itemInfo.paragraph || "Geen beschrijving beschikbaar.";

            itemcontainer.innerHTML = `
                <img src="${ImagePath}" alt=${altText}>
                <h3>${headerText}</h3>
                <p>${paragraafTekst}</p>
            `;

        container.appendChild(itemcontainer);
        });
}

async function dataOphalen(jsonItem, jsonurl){
    const url = jsonurl; // Het pad naar je JSON-bestand

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Fout bij het ophalen: ${response.status} ${response.statusText}`);
        }

        const jsonData = await response.json();

        return jsonData[jsonItem];

    } catch (error) {
        console.error('Er ging iets mis tijdens de fetch-operatie:', error);
    }
}