import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { createPortal } from 'react-dom';

import '../../css/HoofdSchermStyle.css';
import '../../css/cookieStylesheet.css';

import { scrollSlider } from '../../typeScript/sliderCommand.tsx';
import { useVeilingData} from '../../typeScript/ApiGetVeilingItems.tsx';

export default function MainScreen() {
    const { veilingen, loading, error } = useVeilingData();

    if (loading) {
        MyComponent(loading);
    }

    // if (error) return <div>Fout: {error}</div>;

    //maakt het mogelijk om de data op te delen op basis van een item en de inhoud (actief en inactief om te laten zien)
    const actieveVeilingen = veilingen.filter(v => v.status == 'active');
    const inactieveVeilingen = veilingen.filter(v => v.status == 'inactive');
    const allDeals = veilingen;

    console.log(veilingen)

    //renderd de kaart in de main scher, door de opgehaalde API call te verdelen onder de goede items.
    const renderCards = (items: typeof veilingen) =>
        items.flatMap((item, veilingIndex) =>
            item.producten.map((product: producten, index: number) => (
                <AuctionCard
                    key={`${veilingIndex}-${index}`}
                    imagePath={product.imagePath || Default_ImagePlaceholder}
                    altText={product.naam || 'Item afbeelding'}
                    headerText={product.naam || 'Geen Titel'}
                    paragraafText={beschrijving(product, item)}
                />
            ))
        ); 
        
        //voor de beschrijving zodat het invullen van de  beschrijving op een plek is voor overzicht
    const options = {
        
    }
        //enige errors die je hier hebt kloppen niet, het werkt gewoon prima
    const beschrijving = (product: producten, item: typeof veilingen) =>
        `
            lotNummer: ${item.veilingNr}

            Hoeveelheid bloemen: ${product.voorraad}
            prijs begint op: ${product.startprijs}
            
            start tijd is: 
            ${new Date(item.begintijd).toLocaleString('nl-NL', {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour12: false,
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric'
            })}
        `;

    return (
        <main className='MainScreen'>

            <div className="banner">
                <div className="banner-content">
                    <h1>Royal Flora Holland - Veiling</h1>
                    <h2>Verkoop wereldwijd met Royal FloraHolland</h2>
                    <div className="registratie-knoppen">
                        <NavLink to='/inloggen'> <button type="button" className="knop-inloggen" aria-label="knop voor het inloggen bij de website">inloggen &#10095; </button> </NavLink>
                        <NavLink to='/registreren'> <button type="button" className="knop-registreren" aria-label="knop voor registreren van een account">registreren &#10095;</button> </NavLink>
                    </div>
                </div>
            </div>

            <section>
                <h2>Actieve veilingen</h2>
                <div className="slider-container">
                    <button className="arrow" onClick={() => scrollSlider('lastChance', -1)}>&#10094;</button>
                    <div className="slider" id="lastChance">
                        {renderCards(actieveVeilingen)}
                    </div>
                    <button className="arrow" onClick={() => scrollSlider('lastChance', 1)}>&#10095;</button>
                </div>
            </section>

            <section>
                <h2>Inactieve veilingen</h2>
                <div className="slider-container">
                    <button className="arrow" onClick={() => scrollSlider('upcoming', -1)}>&#10094;</button>
                    <div className="slider" id="upcoming">
                        {renderCards(inactieveVeilingen)}
                    </div>
                    <button className="arrow" onClick={() => scrollSlider('upcoming', 1)}>&#10095;</button>
                </div>
            </section>

            <section>
                <h2>All deals</h2>
                <div className="slider-container alle_deals ">
                    <button className="arrow" onClick={() => scrollSlider('alleDeals', -1)}>&#10094;</button>
                    <div className="slider" id="alleDeals">
                        {renderCards(allDeals)}
                    </div>
                    <button className="arrow" onClick={() => scrollSlider('alleDeals', 1)}>&#10095;</button>
                </div>
            </section>

            {/* <aside className="cookie_overlay" id="cookie_popup">
                <div className="cookie_container">
                    <h4>Cookie beleid</h4>
                    <p>GEEF ONS JE DATA!!</p>

                    <label className="switch">
                        <p>Specifieke data opslaan</p>
                        <input type="checkbox"></input>
                        <span className="slider round"></span>
                    </label>
                    
                    <button id="close_cookie_button">X Sluiten</button> 
                    
                </div>
            </aside> */}
        </main>
    )
}

export interface VeilingItem {
    veilingnr: number
    beginTijd: string
    eindTijd: string
    status: string
    minimumPrijs: number
    producten: producten[]
}

export interface producten {
    veilingProductnr: number
    naam: string
    startprijs: number
    voorraad: number
    imagePath?: string
    beschrijving?: string
}

interface CardItems {
  imagePath?: string;
  altText?: string;
  headerText?: string;
  paragraafText?: string;
}

export const Default_ImagePlaceholder = '/src/assets/pictures/webp/MissingPicture.webp';

export function AuctionCard({ imagePath, altText, headerText, paragraafText }: CardItems) {
  const [currentSrc, setCurrentSrc] = useState(imagePath || Default_ImagePlaceholder);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    setCurrentSrc(Default_ImagePlaceholder);
    setHasError(true);
  };

  return (
    <div className='card'>
      <img src={currentSrc} alt={altText} onError={handleError} />
      <div className='text-container'>
        {hasError && <p className='ImageErrorMsg'>foto kan niet gevonden worden</p>}
        <h3>{headerText}</h3>
        <p className='Description'>{paragraafText}</p>
      </div>
      <button className='auctionButton'>go to auction</button>
    </div>
  );
}

function MyComponent(loading) {
  const container = document.querySelector('.slider');

  return (
    <>
      {loading &&
        container &&
        createPortal(<div>Laden van items...</div>, container)}
    </>
  );
}