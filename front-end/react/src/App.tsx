import { Routes, Route, Navigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import type { JSX } from 'react'
import { useEffect } from 'react'

import VeilingmeesterPage from './veilingmeester/VeilingmeesterPage.tsx'
import Hoofdscherm from './schermen/hoofdscherm/Hoofdscherm.tsx'
import PrivacyScherm from './schermen/privacyBeleid/privacyBeleid.tsx'
import Registration from './registratie_login/Registration.tsx'
import Login from './registratie_login/Login.tsx'
import SellerScreenAdd from './schermen/SellerScreenAdd.tsx';
import ErrorPage from './schermen/404Scherm/404.tsx';
import AuctionScreen from './schermen/Veilingscherm/VeilingScherm.tsx';

// import { UpdateApi } from './typeScript/ApiPut.tsx'
import { useAutorefresh } from './typeScript/ApiRefresh.tsx'

import Header, {Footer} from './schermen/Header_footer.tsx'
import SellerScreenInfo from "./schermen/SellerScreenInfo.tsx";
import CustomerScreenInfo from "./schermen/CustomerScreenInfo.tsx";

const getRoleFromToken = (): string | null => {
    const token = sessionStorage.getItem("token");
    if (!token) return null;

    try {
        const decoded: never = jwtDecode(token);
        const RolClaim = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
        return decoded[RolClaim] || null;
    } catch {
        return null;
    }
};

const ProtectedRoute = ({ element, allowedRoles }: { element: JSX.Element, allowedRoles: string[] }) => {
    const role = getRoleFromToken();

    if (!role || !allowedRoles.includes(role)) {
        return <Navigate to="/404" replace />
    }

    return element;
}

// door middel van een post haalt het een nieuwe refresh token op en stopt de refresh en jwt token in session storage
async function performSilentRefresh() {
    const token = sessionStorage.getItem('token');
    const refreshToken = sessionStorage.getItem('refreshToken');

    if (!token || !refreshToken) return;

    try {
        const response = await fetch("http://localhost:5105/auth/refresh", { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, refreshToken })
        });

        if (response.ok) {
            const data = await response.json();

            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('refreshToken', data.refreshToken);
        }
    } catch (error) {
        console.error("Refresh fout:", error);
    }
}

export default function App() {
    const refreshTijd = 342 * 10000; // miliseconden * 10000 = minuten

    // geeft een trigger timer die een auto refresh geeft aan wanneer de refresh token wordt herladen
    const trigger = useAutorefresh(refreshTijd);

    // zoekt een nieuwe refresh token
    useEffect(() => {
        performSilentRefresh();
    }, [trigger]);

    return (
        <>
            <Header />

            {/* ROUTES */}
            <Routes>
                <Route path="/" element={<Navigate to="/home" />} />

                <Route path="/home" element={<Hoofdscherm />} />
                <Route path="/veilingmeester" element={<ProtectedRoute allowedRoles={["VeilingMeester"]} element={<VeilingmeesterPage />} />} />                <Route path="/gegevens" element={<h2 className="h4">Gegevens pagina (coming soon)</h2>} />
                <Route path="/productPlaatsen" element={<ProtectedRoute allowedRoles={["Bedrijf"]} element={<SellerScreenAdd />} />} />
                <Route path="/productBekijken" element={<ProtectedRoute allowedRoles={["Bedrijf"]} element={<SellerScreenInfo />} />} />
                <Route path="/klantGegevens" element={<ProtectedRoute allowedRoles={["Koper"]} element={<CustomerScreenInfo />} />} />
                <Route path="/registreren" element={<Registration />} />
                <Route path="/inloggen" element={<Login />} />
                <Route path="/privacyBeleid" element={<PrivacyScherm />} />
                <Route path='/auction/:veilingnr' element={<AuctionScreen />} />
                <Route path='/404' element={<ErrorPage />} />

                <Route path='*' element={<Navigate to="/404" replace />} />          
            </Routes>

            <Footer />
        </>
    )
}
