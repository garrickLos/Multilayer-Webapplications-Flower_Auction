import { useState } from "react";
import { NavLink } from "react-router-dom";

export interface VeilingItem {
    veilingNr: number
    begintijd: string
    eindtijd: string
    status: string
    minimumPrijs: number
    producten: Producten[]
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

export const renderCards = (items: VeilingItem[]) =>
    items.flatMap((item: VeilingItem, veilingIndex: number) =>
        item.producten.map((product: Producten, index: number) => (
            <AuctionCard
                key={`${veilingIndex}-${index}`}
                imagePath={product.imagePath || Default_ImagePlaceholder}
                headerText={product.naam || 'Geen Titel'}
                paragraafText={beschrijving(product, item)}
                veilingnr={item.veilingNr} 
            />
        ))
); 

export function AuctionCard({ imagePath, headerText, paragraafText }: CardItems) {
  const [currentSrc, setCurrentSrc] = useState(imagePath || Default_ImagePlaceholder);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    setCurrentSrc(Default_ImagePlaceholder);
    setHasError(true);
  };

  return (
    <div className='card'>
      <img src={currentSrc} alt={`De foto laat zien: ${headerText}`} onError={handleError} />
      <div className='text-container'>
        {hasError && <p className='ImageErrorMsg'>foto kan niet gevonden worden</p>}
        <h3>{headerText}</h3>
        <p className='Description'>{paragraafText}</p>
      </div>
      <NavLink to={`/Auction/`} type="button" className='auctionButton' aria-label={`Ga naar de veiling van: ${headerText}`}>go to auction</NavLink>
    </div>
  );
}


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

export function beschrijving(product: Producten, item: VeilingItem) {    
    return (
        ` 
            lot nr: ${item.veilingNr}, product nr: ${product.veilingProductNr}

            Hoeveelheid bloemen: ${product.voorraad}
            prijs begint op: ${product.startprijs} euro

            start tijd is: 
            ${new Date(item.begintijd).toLocaleString('nl-NL', datumOpties)}
        `
    );
}