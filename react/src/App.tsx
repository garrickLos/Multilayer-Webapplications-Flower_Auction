import { Routes, Route } from 'react-router-dom'

import Veilingmeester from './veilingmeester/veilingmeester.tsx'
import Hoofdscherm from './schermen/hoofdscherm/Hoofdscherm.tsx'
import PrivacyScherm from './schermen/privacyBeleid/privacyBeleid.tsx'

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
                <Route path="/veilingPlaatsen" element={""} />
                <Route path="/veilingBekijken" element={""} />
                <Route path="/klantGegevens" element={""} />
                <Route path="/privacyBeleid" element={<PrivacyScherm />} />                
            </Routes>

            <Footer />
        </>
    )
}
