import { NavLink } from 'react-router-dom';
import './css/Header_footerStyle.css';

export default function Header() {
    return (
    <header>
        <div className="HoofschermContainer">
            <div className="logoTitel">
                <img src="/src/assets/pictures/webp/floraHolidayLogo.webp" alt="Royal Flora Holland logo" className="floraLogo"></img>
                <h1>Flora Royal Holland</h1>
            </div>

            <nav>
                <ul>
                    <div className="veilingPLaatsen">
                        <img src="/src/assets/pictures/webp/veilingPlaatsen.webp" alt="houten hamer (gavel)" className="veilingPlaatsenLogo"></img>
                        <NavLink to={'/veiling plaatsen'} className={'navbar'}>
                            <li>Veiling plaatsen</li>
                        </NavLink>
                    </div>
                    <div className="mijnVeilingenBekijken">
                        <img src="/src/assets/pictures/webp/mijnVeilingenBekijken.webp" alt="foto van een blad" className="mijnVeilingenBekijkenLogo"></img>
                        <NavLink to={'/mijnVeilingen'} className={'navbar'}>
                            <li>Mijn veilingen bekijken</li>
                        </NavLink>
                    </div>
                    <div className="klantGegevens">
                        <img src='/src/assets/pictures/webp/klantGegevens.webp' alt="foto van een persoon" className="klantGegevensLogo"></img>
                        <NavLink to={'/klantGegevens'} className={'navbar'}>
                            <li>klantGegevens</li>
                        </NavLink>
                    </div>
                </ul>
            </nav>
        </div>
    </header>
    )
}

export function Footer() {
    return (<footer>
        <div className="overlayBlock">
            <div className="footerText">
                <div className="footer-image">
                    <img src="/src/assets/pictures/ico/Screenshot_2025-10-27_114430-removebg-preview.ico" alt=""></img>
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