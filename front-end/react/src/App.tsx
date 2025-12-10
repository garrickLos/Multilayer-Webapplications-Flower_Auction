import { Routes, Route, Navigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import type { JSX } from 'react'

import VeilingmeesterPage from './veilingmeester/VeilingmeesterPage.tsx'
import Hoofdscherm from './schermen/hoofdscherm/Hoofdscherm.tsx'
import PrivacyScherm from './schermen/privacyBeleid/privacyBeleid.tsx'
import Registration from './registratie_login/Registration.tsx'
import Login from './registratie_login/Login.tsx'
import SellerScreenAdd from './schermen/SellerScreenAdd.tsx';
import ErrorPage from './schermen/404Scherm/404.tsx';
import AuctionScreen from './schermen/AuctionScreen/VeilingScherm.tsx';

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

export default function App() {
    return (
        <>
            <Header />

            {/* ROUTES */}
            <Routes>
                <Route path="/" element={<Navigate to="/home" />} />

                <Route path="/home" element={<Hoofdscherm />} />
                <Route path="/veilingmeester" element={<ProtectedRoute allowedRoles={["Veilingmeester"]} element={<VeilingmeesterPage />} />} />                <Route path="/gegevens" element={<h2 className="h4">Gegevens pagina (coming soon)</h2>} />
                <Route path="/veilingPlaatsen" element={<ProtectedRoute allowedRoles={["Bedrijf"]} element={<SellerScreenAdd />} />} />
                <Route path="/veilingBekijken" element={<ProtectedRoute allowedRoles={["Bedrijf"]} element={<SellerScreenInfo />} />} />
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
