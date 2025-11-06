import {useState} from 'react';
import {NavLink} from 'react-router-dom';

import '../../css/MainScreenStyle.css';
import '../../css/cookieOverlay.css';

import { scrollSlider } from '../../typeScript/sliderCommand.tsx';
import { useAuctionData } from '../../typeScript/jsonOphalen.tsx';

export default function MainScreen() {
    const url = "src/resources/json/HoofdschermMock.json"; 

    return (
        <main>

            <div className="banner">
                <div className="banner-content">
                    <h1>Royal Flora Holland - Veiling</h1>
                    <h2>Verkoop wereldwijd met Royal FloraHolland</h2>
                    <div className="registratie-knoppen">
                        <NavLink to='/inloggen'> <button type="button" className="knop-inloggen" aria-label="knop voor het inloggen">inloggen &#10095; </button> </NavLink>
                        <NavLink to='/registreren'> <button type="button" className="knop-registreren" aria-label="knop voor registreren van een account">registreren &#10095;</button> </NavLink>
                    </div>
                </div>
            </div>

            <section>
                <h2>Laatste kans!</h2>
                <div className="slider-container">
                    <button className="arrow" onClick={() => scrollSlider('lastChance', -1)}>&#10094;</button>
                    <div className="slider" id="lastChance">
                        {renderContent("alleDeals", url)}
                    </div>
                    <button className="arrow" onClick={() => scrollSlider('lastChance', 1)}>&#10095;</button>
                </div>
            </section>

            <section>
                <h2>Aankomende veilingen!</h2>
                <div className="slider-container">
                    <button className="arrow" onClick={() => scrollSlider('upcoming', -1)}>&#10094;</button>
                    <div className="slider" id="upcoming">
                        {renderContent("AankomendeVeilingen", url)}
                    </div>
                    <button className="arrow" onClick={() => scrollSlider('upcoming', 1)}>&#10095;</button>
                </div>
            </section>

            <section>
                <h2>All deals</h2>
                <div className="slider-container alle_deals ">
                    <button className="arrow" onClick={() => scrollSlider('alleDeals', -1)}>&#10094;</button>
                    <div className="slider" id="alleDeals">
                        {renderContent("alleDeals", url)}
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

interface CardItems{
    imagePath: string;
    altText: string;
    headerText: string;
    paragraafText: string;
}

const Default_ImagePlaceholder = '/src/assets/pictures/webp/MissingPicture.webp';

const AuctionCard: React.FC<CardItems> = ({ imagePath, altText, headerText, paragraafText }) => {
    
    const [currentSrc, setCurrentSrc] = useState(imagePath || Default_ImagePlaceholder);
    
    const [hasError, setHasError] = useState(false);

    const handleError = () => {
        setCurrentSrc(Default_ImagePlaceholder);

        setHasError(true);
    };

    function imageError(hasError: boolean){
        if (hasError){
            return <p className='ImageErrorMsg'>foto kan niet gevonden worden</p>
        }
    }

    return (
        <div className='card'>
            <img 
                src={currentSrc} 
                alt={altText}
                onError={handleError}
            />
            <div className='text-container'>
                {imageError(hasError)}
                
                <h3>{headerText}</h3>
                <p>{paragraafText}</p>
            </div>
            <button className='auctionButton'>go to auction</button>
        </div>
    );
};

const renderContent = (item_key: string, url: string) => {
    let { data, isLoading, error } = useAuctionData(item_key , url);

    if (isLoading) {
        return <div key="loading">Laden van items...</div>; 
    }
    
    if (error) {
        return <div key="error">Fout: {error}</div>;
    }

    if (data.length === 0) {
        return <div key="empty">Geen items gevonden.</div>;
    }

    return data.map((item, index) => {
        const ImagePath = item.imagePath || Default_ImagePlaceholder;
        const altText = item["afbeelding-alt"] || "Item afbeelding";
        const headerText = item.header_info || "Geen Titel";
        const paragraafTekst = item.paragraph || "Geen beschrijving beschikbaar.";

        return (
            <AuctionCard key={index} imagePath={ImagePath} altText={altText} headerText={headerText} paragraafText={paragraafTekst}
            />
        );
    });
};