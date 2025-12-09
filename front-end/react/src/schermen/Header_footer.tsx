import { NavLink } from 'react-router-dom';
import '../css/HeaderStylesheet.css';
import '../css/FooterStylesheet.css';
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";

export default function Header() {

    const [role, setRole] = useState<string | null>(null);
    
    useEffect(() => {
        const updateRoleFromToken = () => {
            const token = sessionStorage.getItem("token");
            if (!token) {
                setRole(null);
                return;
            }

            try {
                const decoded: any = jwtDecode(token);
                const RolClaim = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
                setRole(decoded[RolClaim]);
                console.log(decoded[RolClaim]);
                TokenOphalen.setToken(token);
            } catch {
                setRole(null);
            }
        };
        updateRoleFromToken();

        // Eventlistener die krijgt een seintje na het inloggen dat er is ingelogd en kijkt dan opnieuw welke rol actief is
        const handleLogin = () => updateRoleFromToken();
        window.addEventListener('login', handleLogin);

        // Maakt hem weer leeg voor de volgende inlog
        return () => {
            window.removeEventListener('login', handleLogin);
        };
    }, []);


    return (
        <header>
            <div className="HoofschermContainer">
                <div className="logoTitel">
                    <NavLink to="/home">
                        <img src="/src/assets/pictures/webp/floraHolidayLogo.webp"
                             alt="Royal Flora Holland logo"
                             className="floraLogo" />
                    </NavLink>
                    <h1>Royal Flora Holland</h1>
                </div>

                <nav>
                    <ul>
                        {role === "Bedrijf" && (
                            <div className="veilingPLaatsen">
                                <img src="/src/assets/pictures/webp/veilingPlaatsen.webp"
                                     alt="houten hamer"
                                     className="veilingPlaatsenLogo" />
                                <NavLink to='/veilingPlaatsen'>Veiling plaatsen</NavLink>
                            </div>
                        )}

                        {role === "Bedrijf" && (
                            <div className="mijnVeilingenBekijken">
                                <img src="/src/assets/pictures/webp/mijnVeilingenBekijken.webp"
                                     alt="foto van een blad"
                                     className="mijnVeilingenBekijkenLogo" />
                                <NavLink to='/veilingBekijken'>Mijn veilingen bekijken</NavLink>
                            </div>
                        )}

                        {role === "Koper" && (
                            <div className="klantGegevens">
                                <img src="/src/assets/pictures/webp/klantGegevens.webp"
                                     alt="foto van een persoon"
                                     className="klantGegevensLogo" />
                                <NavLink to='/klantGegevens'>Klantgegevens</NavLink>
                            </div>
                        )}
                        <div className="uitloggen">
                            <img src="/src/assets/pictures/webp/klantGegevens.webp"
                                 alt="foto van een persoon"
                                 className="klantGegevensLogo" />
                            <NavLink to="/home" onClick={() => {
                                sessionStorage.removeItem("token");
                                setRole(null); // direct UI bijwerken
                            }}>
                                Uitloggen
                            </NavLink>
                        </div>
                    </ul>
                </nav>
            </div>
        </header>
    );
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

export class TokenOphalen {
    private static token: string = "";
    
    static setToken(token: string) {
        this.token = token;
    }
    
    static getToken(){
        return this.token;
    }
}
