import { useState } from "react";

import { GenereerKnop } from "../../Componenten/Knop";
import { DelenDoor as SetEuro } from "../../typeScript/RekenFuncties";
import { GetDate } from "../../typeScript/FetchDate";

// css
import '../../css/Componenten/AuctionCards.css';

export interface VeilingItem {
    veilingNr: number
    begintijd: string
    eindtijd: string
    status: string
    minimumPrijs: number
    producten: Producten
}

export interface Producten {
    veilingProductNr: number
    naam: string
    startprijs: number
    voorraad: number
    imagePath?: string
    beschrijving?: string
}

interface CardItems {
    imagePath?: string;
    headerText?: string;
    paragraafText?: string;
    veilingnr?: number;
}

const Default_ImagePlaceholder = '/src/assets/pictures/webp/MissingPicture.webp';

export function AuctionCard({ imagePath, headerText, paragraafText, veilingnr }: CardItems) {
  const [currentSrc, setCurrentSrc] = useState(imagePath || Default_ImagePlaceholder);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    setCurrentSrc(Default_ImagePlaceholder);
    setHasError(true);
  };

  return (
    <div className='RenderCard grid-item'>
        <img src={currentSrc} alt={`De foto laat zien: ${headerText}`} onError={handleError} />
        <div className='RenderCard_text-container'>
            {hasError && <p className='ImageErrorMsg'>foto kan niet gevonden worden</p>}
            <h3>{headerText}</h3>
            <p className='Description'>{paragraafText}</p>
        </div>

        <GenereerKnop 
            classNames={'Button'} 
            bericht={'naar de veiling'} 
            to={`/auction/${veilingnr}`} 
        />
    </div>
  );
}

export function beschrijving(product: Producten, item: VeilingItem) {    
    return (
        ` 
            lot nr: ${item.veilingNr}, product nr: ${product.veilingProductNr}

            Hoeveelheid bloemen: ${product.voorraad}
            prijs begint op: ${ SetEuro(product.startprijs, 100).toFixed(2)} euro

            veiling startijd: 
            ${GetDate(item.begintijd, 'nl-NL')}
        `
    );
}