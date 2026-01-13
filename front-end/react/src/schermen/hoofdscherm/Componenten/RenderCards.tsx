import { useState } from "react";
import { NavLink } from "react-router-dom";
import MissingPicture from "../../../assets/pictures/webp/MissingPicture.webp";
import { resolveImageUrl } from "../../../config/api";

// import type index
import type { CardItems, VeilingItem, Producten } from '../../hoofdscherm/Componenten/index';

const Default_ImagePlaceholder = MissingPicture;

export function AuctionCard({ imagePath, headerText, paragraafText, veilingnr }: CardItems) {
  const [currentSrc, setCurrentSrc] = useState(resolveImageUrl(imagePath) || Default_ImagePlaceholder);
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

      <NavLink to={`/auction/${veilingnr}`} state={{veilingnr: veilingnr}} 
              type="button" className='auctionButton' 
              aria-label={`Ga naar de veiling van: ${headerText}`}>naar de veiling</NavLink>
    
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

            Hoeveelheid bloemen: ${product.aantalFusten}
            prijs begint op: ${product.startprijs} euro

            veiling startijd: 
            ${new Date(item.begintijd).toLocaleString('nl-NL', datumOpties)}
        `
    );
}
