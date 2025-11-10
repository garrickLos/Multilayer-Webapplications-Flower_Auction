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

async function genereerDataItem(containerId, divClass, jsonItem, jsonUrl) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Fout bij het vinden van de ID: De container met het ID "${containerId}" is niet gevonden.`);
        return;
    }

    const dataVanJson = await dataOphalen(jsonItem, jsonUrl); 

    if (!dataVanJson) {
        console.warn(`Geen data gevonden voor item: ${jsonItem}.`);
        return;
    }

    const keysInOrder = Object.keys(dataVanJson);

    // 3. Loop door deze array
    keysInOrder.forEach(key => {
        
        const value = dataVanJson[key];

        // 4. Controleer of de key BEGINT met 'paragraph'
        if (key.startsWith('paragraph')) {
            createParagraphItem(value, container);

        } else if (key.startsWith('List')) {
            createListItem(value, divClass, container);
        }
        // Andere keys worden genegeerd
    });
}

function createParagraphItem(jsonParagraph, container) {
    const pElement = document.createElement('p');
    
    pElement.textContent = jsonParagraph;
    container.appendChild(pElement);

    console.log(pElement);
}

function createListItem(jsonList, divClass, container){
    // De 'List' array bevat slechts één object: [{ item1: "...", item2: "..." }]
    const listObject = jsonList[0]; 

    // Maak de Ongeordende Lijst (ul) of Geordende Lijst (ol) aan
    const ulContainer = document.createElement('ul'); // Gebruik <ul> voor een opsomming
    ulContainer.classList.add(divClass); // Voeg de klasse toe aan de lijst container
    
    // Loop door ALLE keys (item1, item2, ...) in het ENIGE object
    for (const key in listObject) {
        if (listObject.hasOwnProperty(key)) {
            
            const listItemText = listObject[key];
            
            // Maak het Lijst Item (li)
            const listItem = document.createElement('li');
            
            // Voeg de tekst toe (we gebruiken textContent voor veiligheid)
            listItem.textContent = listItemText; 
            
            // Voeg het lijst item toe aan de <ul>
            ulContainer.appendChild(listItem);
            
            console.log(`Toegevoegd: ${listItemText}`);
        }
    }
    
    // Voeg de complete lijst toe aan de hoofding container
    container.appendChild(ulContainer);
}