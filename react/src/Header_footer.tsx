import { NavLink } from 'react-router-dom';
import './css/HeaderStylesheet.css';
import './css/FooterStylesheet.css';

export default function Header() {
    return (
    <header>
        <div className="HoofschermContainer">
            <div className="logoTitel">
                <a href="/"><img src="/src/assets/pictures/webp/floraHolidayLogo.webp" alt="Royal Flora Holland logo" className="floraLogo"></img></a>
                <h1>Flora Royal Holland</h1>
            </div>

            <nav>
                <ul>
                    <div className="veilingPLaatsen">
                        <img src="/src/assets/pictures/webp/veilingPlaatsen.webp" alt="houten hamer (gavel)" className="veilingPlaatsenLogo"></img>
                        <a href='/veilingPlaatsen'>Veiling plaatsen</a>
                    </div>
                    <div className="mijnVeilingenBekijken">
                        <img src="/src/assets/pictures/webp/mijnVeilingenBekijken.webp" alt="foto van een blad" className="mijnVeilingenBekijkenLogo"></img>
                        <a href='/veilingBekijken'>Mijn veilingen bekijken</a>
                    </div>
                    <div className="klantGegevens">
                        <img src="/src/assets/pictures/webp/klantGegevens.webp" alt="foto van een persoon" className="klantGegevensLogo"></img>
                        <a href='/klantGegevens'>klantGegevens</a>
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
                <div className="text-column_one">
                    <p>Intranet Royal FloraHolland</p>
                </div>
                <div className="text-column_two">
                </div>
            </div>
        </div>
    </footer>
    )
}