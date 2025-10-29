function genereerDataItem(jsonBestand, containerId, divClass, imagePath) {
    const container = document.getElementById(containerId);

    if (!container) {
        console.error('Fout by het vinden van de id: '+
            'de container met het id "${containerId}" niet gevonden');
            return;
    }

    const itemcontainer = document.createElement('div');
    itemcontainer.classList.add(divClass);

    if (!imagePath) {
        imagePath = "/front-end/resources/pictures/webp/download.webp";
    }
    dataOphalen();
    itemcontainer.innerHTML = `
        <img src="${imagePath}" alt="Afbeelding van het item">
        <h3>Artificial Citroen boom in deco pot</h3>
        <p>Lorem ipsum dolor sit amet.</p>
    `;

    container.appendChild(itemcontainer);
}

function dataOphalen(){
    console.log("dit is wat data");
}