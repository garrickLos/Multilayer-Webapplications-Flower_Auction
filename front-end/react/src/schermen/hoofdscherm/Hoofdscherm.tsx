import { NavLink } from 'react-router-dom';

import '../../css/HoofdSchermStyle.css';
import '../../css/cookieStylesheet.css';

import { CountPages, scrollSlider } from '../../typeScript/sliderCommand.tsx';
import { AuctionCard, type VeilingItem } from './RenderCards.tsx';
import { useAutorefresh as ApiRefresh } from '../../typeScript/ApiRefresh.tsx';
import { ApiRequest } from '../../typeScript/ApiRequest.tsx';

import { useEffect, useState } from 'react';

import '../../css/Componenten/knop.css';
import { Laadscherm } from '../AuctionScreen/VeilingSchermComponenten/Laadscherm.tsx';
import { ErrorScherm } from '../AuctionScreen/VeilingSchermComponenten/ErrorComponent.tsx';

export default function MainScreen() {
    const RefreshTimeMS = 60000; // 6000 miliseconden zou 6 seconden moeten zijn
    const refreshTimer = ApiRefresh(RefreshTimeMS);

    let sendingData = null;
    let jwtToken = null;
    let refreshToken = null;

    const [veilingen, setVeilingen] = useState<VeilingItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        ApiRequest<VeilingItem[]>(`/api/Veiling/anonymous?refresh=${refreshTimer}&onlyActive=${true}`, "GET", sendingData, jwtToken, refreshToken)
            .then(result => {
                if (isMounted) {
                    setVeilingen(result || []);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setVeilingen([]);
                    setLoading(false);
                }
            });

        return () => { isMounted = false; };

    }, [refreshTimer]);

    const actieveVeilingen = veilingen;

    const laadbericht = "laden van items..."
    
    return (
        <main className='MainScreen'>

            <div className="banner">
                <div className="banner-content">
                    <h1>Royal Flora Holland - Veiling</h1>
                    <h2>Verkoop wereldwijd met Royal FloraHolland</h2>
                    <div className="registratie-knoppen">
                        <NavLink to='/inloggen' className="knop-inloggen knoppen" aria-label="knop voor het inloggen bij de website">inloggen &#10095; </NavLink>
                        <NavLink to='/registreren' className="knop-registreren knoppen" aria-label="knop voor registreren van een account">registreren &#10095; </NavLink>
                    </div>
                </div>
            </div>
            
            <section ref={(node) => { if (node) {CountPages("grid-container", 'AmountOfPages');}}}>

                <h2>Flora veilingen</h2>
                <div className="AmountOfPages"></div>
                <div className="slider-container">
                    <button className="arrow" onClick={() => scrollSlider('lastChance', -1)}>&#10094;</button>
                    <div className="slider" id="lastChance">
                        {loading ? Laadscherm(laadbericht) : renderSliderContent(actieveVeilingen)}
                    </div>
                    <button className="arrow" onClick={() => scrollSlider('lastChance', 1)}>&#10095;</button>
                </div>
            </section>
        </main>
    )
}

function renderSliderContent(dataToRender: VeilingItem[]) {
    // Maak een platte lijst van alle producten van alle veilingen
    // We voegen de veilinginformatie toe aan elk product-object
    const alleProducten = dataToRender.flatMap(veiling => 
        veiling.producten.map(product => ({
            ...product,
            parentVeiling: veiling // Bewaar de referentie naar de veiling voor de beschrijving
        }))
    );

    const itemsPerPage = 10;
    const pages = [];
        
    // 2. Verdeel de platte lijst met PRODUCTEN in groepen van 10
    for (let i = 0; i < alleProducten.length; i += itemsPerPage) {
        pages.push(alleProducten.slice(i, i + itemsPerPage));
    }

    if (alleProducten.length === 0) {
        return (
            ErrorScherm()
        );

    } else {
        return (
            <>
                {pages.map((pageItems, pageIndex) => (
                    <div key={`page-${pageIndex}`} className="grid-container">
                        {pageItems.map((item, index) => (
                            <AuctionCard
                                key={`${item.parentVeiling.veilingNr}-${item.veilingProductNr}-${index}`}
                                /* Geef de data door via de juiste prop-namen */
                                product={item} 
                                parentVeiling={item.parentVeiling}
                            />
                        ))}
                    </div>
                ))}
            </>
        );
    }
}