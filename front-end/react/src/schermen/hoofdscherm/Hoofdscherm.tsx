import { NavLink } from 'react-router-dom';
import { useEffect } from 'react';

import '../../css/HoofdSchermStyle.css';
import '../../css/cookieStylesheet.css';
import '../../css/loadIcon.css';

import { CountPages, scrollSlider } from '../../typeScript/sliderCommand.tsx';
import { UseDataApi as GetVeilingen } from '../../typeScript/ApiGet.tsx';
import { beschrijving, AuctionCard, type VeilingItem } from './RenderCards.tsx';
import { useAutorefresh as ApiRefresh } from '../../typeScript/ApiRefresh.tsx';

import '../../css/Componenten/knop.css';

/*
    to do:
    * foto kan niet gevonden worden error (positioneerd boven alles en niet op kaart)
*/


export default function MainScreen() {
    const RefreshTimeMS = 60000;
    const refreshTimer = ApiRefresh(RefreshTimeMS);

    const { data, loading, error } = GetVeilingen<VeilingItem[]>(`/api/Veiling/anonymous?refresh=${refreshTimer}`);

    const safeVeilingen = data || [];

    const actieveVeilingen = safeVeilingen.filter(v => v.status == 'active');

    const renderSliderContent = (dataToRender: VeilingItem[]) => {
        // 1. Maak een platte lijst van alle producten van alle veilingen
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
        
        return (
            <>
                {pages.map((pageItems, pageIndex) => (
                    <div key={`page-${pageIndex}`} className="grid-container">
                        {pageItems.map((item, index) => (
                            <AuctionCard
                                key={`${item.parentVeiling.veilingNr}-${item.veilingProductNr}-${index}`}
                                imagePath={item.imagePath}
                                headerText={item.naam || 'Geen Titel'}
                                paragraafText={beschrijving(item, item.parentVeiling)}
                                veilingnr={item.parentVeiling.veilingNr} 
                            />
                        ))}
                    </div>
                ))}
            </>
        );
    };
    
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
                        {renderSliderContent(actieveVeilingen)}
                    </div>
                    <button className="arrow" onClick={() => scrollSlider('lastChance', 1)}>&#10095;</button>
                </div>
            </section>
        </main>
    )
}