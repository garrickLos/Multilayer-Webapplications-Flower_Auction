import { NavLink } from 'react-router-dom';
import { createPortal } from 'react-dom';

import '../../css/HoofdSchermStyle.css';
import '../../css/cookieStylesheet.css';

import { scrollSlider } from '../../typeScript/sliderCommand.tsx';
import { useVeilingData } from '../../typeScript/ApiGetVeilingItems.tsx';
import { renderCards } from './RenderCards.tsx';

export default function MainScreen() {
    const { veilingen, loading, error } = useVeilingData();

    if (loading) {
        StateComponent({ component: loading });
    }

    if (error) {
        StateComponent({ component: error });
    }

    //maakt het mogelijk om de data op te delen op basis van een item en de inhoud (actief en inactief om te laten zien)
    const actieveVeilingen = veilingen.filter(v => v.status == 'active');
    const inactieveVeilingen = veilingen.filter(v => v.status == 'inactive');
    const allDeals = veilingen;
        
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
interface StateComponentProps {
    component: string | boolean;
}

function StateComponent({ component }: StateComponentProps): React.ReactElement | null {
    const container = document.querySelector('.slider');

    return (
        <>
            {component &&
                container &&
                createPortal(<div>{component}</div>, container)}
        </>
    );
}