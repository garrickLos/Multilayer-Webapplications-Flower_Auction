import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';

import '../../css/HoofdSchermStyle.css';
import '../../css/cookieStylesheet.css';
import '../../css/loadIcon.css';

import { scrollSlider } from '../../typeScript/sliderCommand.tsx';
import { UseDataApi as GetVeilingen } from '../../typeScript/ApiGet.tsx';
import { renderCards, type VeilingItem } from './RenderCards.tsx';

export default function MainScreen() {
    let ApiRefreshTime: number = 180000;

    const [refreshTimer, setRefreshTimer] = useState(Date.now());

    const { data, loading, error } = GetVeilingen<VeilingItem[]>(`/api/Veiling/anonymous?refresh=${refreshTimer}`);

    const safeVeilingen = data || [];

    useEffect(() => {
        // 300000 milliseconden = 5 minuten (180000 = 3 minuten)
        const intervalId = setInterval(() => {
            setRefreshTimer(Date.now());
        }, ApiRefreshTime);

        // Ruim de timer op als de component verdwijnt
        return () => clearInterval(intervalId);
    }, []);

    const actieveVeilingen = safeVeilingen.filter(v => v.status == 'active');
    const inactieveVeilingen = safeVeilingen.filter(v => v.status == 'inactive');
    const allDeals = safeVeilingen;

    const renderSliderContent = (data: any[]) => {
        if (loading) {
            return (
                <div className="Hoofdscherm_state-container">
                    <span className='loader'></span>
                    <br></br>
                    <p>Loading data</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="Hoofdscherm_state-container">
                    <p className='mainScreen_errorCode'>Error:  kon gegevens niet vinden of database connectie bestaat niet<br></br>{String(error)}</p>
                </div>
            );
        }
        return renderCards(data);
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

            <section>
                <h2>Actieve veilingen</h2>
                <div className="slider-container">
                    <button className="arrow" onClick={() => scrollSlider('lastChance', -1)}>&#10094;</button>
                    <div className="slider" id="lastChance">
                        {renderSliderContent(actieveVeilingen)}
                    </div>
                    <button className="arrow" onClick={() => scrollSlider('lastChance', 1)}>&#10095;</button>
                </div>
            </section>

            <section>
                <h2>Inactieve veilingen</h2>
                <div className="slider-container">
                    <button className="arrow" onClick={() => scrollSlider('upcoming', -1)}>&#10094;</button>
                    <div className="slider" id="upcoming">
                        {renderSliderContent(inactieveVeilingen)}
                    </div>
                    <button className="arrow" onClick={() => scrollSlider('upcoming', 1)}>&#10095;</button>
                </div>
            </section>

            <section>
                <h2>All deals</h2>
                <div className="slider-container alle_deals ">
                    <button className="arrow" onClick={() => scrollSlider('alleDeals', -1)}>&#10094;</button>
                    <div className="slider" id="alleDeals">
                        {renderSliderContent(allDeals)}
                    </div>
                    <button className="arrow" onClick={() => scrollSlider('alleDeals', 1)}>&#10095;</button>
                </div>
            </section>
        </main>
    )
}