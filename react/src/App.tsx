import { Routes, Route } from 'react-router-dom'

import {Veilingmeester} from './veilingmeester/Veilingmeester.tsx'
import Hoofdscherm from './schermen/hoofdscherm/Hoofdscherm.tsx'
import PrivacyScherm from './schermen/privacyBeleid/privacyBeleid.tsx'
import Registration from './registratie_login/Registration.tsx'
import Login from './registratie_login/Login.tsx'
import SellerScreenAdd from './schermen/SellerScreenAdd.tsx';

import Header, {Footer} from './schermen/Header_footer.tsx'


export default function App() {
    return (
        <>
            <Header />

            {/* ROUTES */}
            <Routes>
                <Route path="/" element={<Hoofdscherm />} />
                <Route path="/veilingmeester" element={<Veilingmeester />} />
                <Route path="/gegevens" element={<h2 className="h4">Gegevens pagina (coming soon)</h2>} />
                <Route path="/veilingPlaatsen" element={<SellerScreenAdd />} />
                <Route path="/veilingBekijken" element={""} />
                <Route path="/klantGegevens" element={""} />
                <Route path="/privacyBeleid" element={<PrivacyScherm />} />
                <Route path="/registreren" element={<Registration />} />
                <Route path="/inloggen" element={<Login />} />

            </Routes>

            <Footer />
        </>
    )
}
