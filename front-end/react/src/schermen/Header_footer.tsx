import { NavLink } from 'react-router-dom';
import '../css/HeaderStylesheet.css';
import '../css/FooterStylesheet.css';
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";

export default function Header() {
    interface JwtClaims {
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"?: string;
}

    const [role, setRole] = useState<string | null>(null);
    const [gebruikerNummer, setGebruikerNummer] = useState<string | null>(null);
    
    useEffect(() => {
        const updateRoleFromToken = () => {
            const token = sessionStorage.getItem("token");
            if (!token) {
                setRole(null);
                setGebruikerNummer(null);
                return;
            }

            try {
                const decoded = jwtDecode<JwtClaims>(token);
                const RolClaim = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
                const gebruikerClaim = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";
                setRole(decoded[RolClaim] || null);
                
                const nummer = decoded[gebruikerClaim] || null;
                setGebruikerNummer(nummer);

                if(nummer != null){
                    sessionStorage.setItem("gebruikerNummer", nummer);
                }

            
                TokenOphalen.setToken(token);
            } catch {
                setRole(null);
                setGebruikerNummer(null);
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
                                <NavLink to='/productPlaatsen'>Product plaatsen</NavLink>
                            </div>
                        )}

                        {role === "Bedrijf" && (
                            <div className="mijnVeilingenBekijken">
                                <img src="/src/assets/pictures/webp/mijnVeilingenBekijken.webp"
                                     alt="foto van een blad"
                                     className="mijnVeilingenBekijkenLogo" />
                                <NavLink to='/productBekijken'>Mijn producten bekijken</NavLink>
                            </div>
                        )}

                        {role === "Koper" && (
                            <div className="klantGegevens">
                                <img src="/src/assets/pictures/webp/klantGegevens.webp"
                                     alt="foto van een persoon"
                                     className="klantGegevensLogo" />
                                <NavLink to='/klantGegevens'>Mijn biedingen</NavLink>
                            </div>
                        )}

                        {role === "VeilingMeester" && (
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
