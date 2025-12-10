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
                const decoded: never = jwtDecode(token);
                const RolClaim = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

                setRole(decoded[RolClaim] || null);

                TokenOphalen.setToken(token);
            } catch {
                setRole(null);
            }
        };
        updateRoleFromToken();

        const handleLogin = () => updateRoleFromToken();
        window.addEventListener('login', handleLogin);

        return () => {
            window.removeEventListener('login', handleLogin);
        };
    }, []);

    const isLoggedIn = !!role;

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
                                <NavLink to='/klantGegevens'>overzicht biedingen</NavLink>
                            </div>
                        )}

                        {role === "Veilingmeester" && (
                            <div className="veilingPLaatsen">
                                <img src="/src/assets/pictures/webp/veilingPlaatsen.webp"
                                     alt="houten hamer"
                                     className="veilingPlaatsenLogo" />
                                <NavLink to='/veilingmeester'>Veilingmeester</NavLink>
                            </div>
                        )}

                        {!isLoggedIn && (
                            <div className="uitloggen">
                                <img src="/src/assets/pictures/webp/klantGegevens.webp"
                                     alt="foto van een persoon"
                                     className="klantGegevensLogo" />
                                <NavLink to="/inloggen">Inloggen</NavLink>
                            </div>
                        )}
                        {!isLoggedIn && (
                            <div className="uitloggen">
                                <img src="/src/assets/pictures/webp/klantGegevens.webp"
                                     alt="foto van een persoon"
                                     className="klantGegevensLogo" />
                                <NavLink to="/registreren">Registreren</NavLink>
                            </div>
                        )}

                        {isLoggedIn && (
                            <div className="uitloggen">
                                <img src="/src/assets/pictures/webp/klantGegevens.webp"
                                     alt="foto van een persoon"
                                     className="klantGegevensLogo" />
                                <NavLink to="/home" onClick={() => {
                                    sessionStorage.removeItem("token");
                                    setRole(null);
                                }}>
                                    Uitloggen
                                </NavLink>                            </div>
                        )}
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
