import { NavLink } from 'react-router-dom';

import '../css/HeaderStylesheet.css';
import '../css/FooterStylesheet.css';

export default function Header() {
    return (
    <header>
        <div className="HoofschermContainer">
            <div className="logoTitel">
                <NavLink to="/home"><img src="/src/assets/pictures/webp/floraHolidayLogo.webp" alt="Royal Flora Holland logo" className="floraLogo"></img></NavLink>
                <h1>Royal Flora Holland</h1>
            </div>

            <nav>
                <ul>
                    <div className="veilingPLaatsen">
                        <img src="/src/assets/pictures/webp/veilingPlaatsen.webp" alt="houten hamer (gavel)" className="veilingPlaatsenLogo"></img>
                        <NavLink to='/veilingPlaatsen'>Veiling plaatsen</NavLink>
                    </div>
                    <div className="mijnVeilingenBekijken">
                        <img src="/src/assets/pictures/webp/mijnVeilingenBekijken.webp" alt="foto van een blad" className="mijnVeilingenBekijkenLogo"></img>
                        <NavLink to='/veilingBekijken'>Mijn veilingen bekijken</NavLink>
                    </div>
                    <div className="klantGegevens">
                        <img src="/src/assets/pictures/webp/klantGegevens.webp" alt="foto van een persoon" className="klantGegevensLogo"></img>
                        <NavLink to='/klantGegevens'>klantGegevens</NavLink>
                    </div>
                    <div className="uitloggen">
                        <img src="/src/assets/pictures/webp/klantGegevens.webp" alt="foto van een persoon" className="klantGegevensLogo"></img>
                        <NavLink to="/home" onClick={() => {
                            sessionStorage.removeItem("token"); // verwijder de token
                        }}>Uitloggen</NavLink>
                    </div>
                </ul>
            </nav>
        </div>
    </header>
    )
}

export function Footer() {
    return (
        <footer>
            <div className="overlayBlock">
                <div className="footerText">
                    <div className="footer-image">
                        <img src="/src/assets/pictures/ico/RoyalFloraFooter_Icon.ico" alt=""></img>
                    </div>
                    <div className="text-column">
                        <NavLink to='/privacyBeleid'>privacy beleid</NavLink>
                    </div>
                </div>
            </div>
        </footer>
    )
}