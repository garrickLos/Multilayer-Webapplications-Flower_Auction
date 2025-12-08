import { Routes, Route, Navigate } from 'react-router-dom'

import {Veilingmeester} from './veilingmeester/Veilingmeester.tsx'
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


export default function App() {
    return (
        <>
            <Header />

            {/* ROUTES */}
            <Routes>
                <Route path="/" element={<Navigate to="/home" />} />

                <Route path="/home" element={<Hoofdscherm />} />
                <Route path="/veilingmeester" element={<Veilingmeester />} />
                <Route path="/gegevens" element={<h2 className="h4">Gegevens pagina (coming soon)</h2>} />
                <Route path="/veilingPlaatsen" element={<SellerScreenAdd />} />
                <Route path="/veilingBekijken" element={<SellerScreenInfo />} />
                <Route path="/klantGegevens" element={<CustomerScreenInfo />} />/
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
