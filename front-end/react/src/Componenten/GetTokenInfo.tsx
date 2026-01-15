import { jwtDecode } from "jwt-decode";
import { getBearerToken } from '../Componenten/index';

interface JwtClaims {
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"?: string;
}

export function GetTokenInfo(): string | null {
    const token = getBearerToken();
    if (!token) {
        return null;
    }

    try {
        const decoded = jwtDecode<JwtClaims>(token);
        const RolClaim = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
        const gebruikerClaim = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";
        const rol = decoded[RolClaim] || null;

        const nummer = decoded[gebruikerClaim] || null;
        if (nummer != null) {
            sessionStorage.setItem("gebruikerNummer", nummer);
        }

        TokenOphalen.setToken(token);

        return rol;
    } catch {
        return null;
    }
}

export class TokenOphalen {
    private static token: string = "";

    static setToken(token: string) {
        this.token = token;
    }

    static getToken() {
        return this.token;
    }
}