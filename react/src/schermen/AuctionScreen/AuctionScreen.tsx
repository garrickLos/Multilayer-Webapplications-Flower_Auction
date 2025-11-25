
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Timer } from '../AuctionScreen/RenderTimer.tsx';

import '../../css/AuctionScreen.css';

export default function AuctionScreen() {
    const [aantal, setAantal] = useState(0);
    const [huidigePrijs, setHuidigePrijs] = useState(0);

    const location = useLocation();
    const veilingItem = location.state?.veilingnr || 0;

    const verwerkVerandering = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Haal de nieuwe waarde uit de input
        const nieuweWaarde = e.target.value;

        // Update de state variabele
        setAantal(Number(nieuweWaarde));         
    };

    const totaalPrijs = (aantal * huidigePrijs).toFixed(2);

    return (
    <main className='Auction_Body'>
        <section>
            <h2>Artificial Citroen boom in deco pot</h2>
        </section>

        <section>
            <h2>Actn:</h2>
            <h3>VeilingNummer: {veilingItem}</h3>
        </section>

        <div className="Auction_Container">
            {/* <!-- Schermdeel 1 fotos van producten (nu staan ze vast later moeten ze toegevoegd worden) --> */}
            <section className="Auction_Foto">
                <div className="Auction_fotoContainer">
                    <img src="../../src/assets/pictures/productBloemen/DecoratieveDahliaSunsetFlare.webp" alt="Foto van een bloem" className="Auction_veilingFoto"></img>
                </div>
            </section>

            {/* <!-- Schermdeel 2 product informatie toevoegen --> */}
            <section className="schermDeel2">
                <div className="scherm2Container">
                    <div className="kopje">Product Details</div>
                    <div className="ordenen">
                        <div className="username">Product naam:</div>
                    </div>
                    <div className="ordenen">
                        <div className="productCategorie">Product categorie:</div>
                    </div>
                    <div className="ordenen">
                        <div className="hoeveelheid">Aantal:</div>
                    </div>
                    <div className="ordenen">
                        <div className="Place">Plaats:</div>
                    </div>
                </div>
            </section>

            {/* <!-- Rechter deel van het scherm (miminumprijs en plaats bod) --> */}
            <section className="Auction_schermAankoop">
                <div className="Auction_schermAankoop_container">
                    <div className="Auction_klok">
                        <Timer onPrijsUpdate={setHuidigePrijs} targetVeilingNr={veilingItem}/>
                    </div>
                    <div className="huidigePrijs">
                        price:
                    </div>
                    <label htmlFor="aantalkopenstuks" className="aantalKopen">Aantal:</label>
                    <input type="number" id="aantalkopenstuks" name="aantalkopenstuks" onChange={verwerkVerandering}/>
                    <div className="tekstVoorKopen">Je koopt {aantal} voor <Timer onPrijsUpdate={setHuidigePrijs} targetVeilingNr={veilingItem}/> per stuk, in totaal {totaalPrijs}.</div>
                    <button className="koopNu">Koop nu!</button>
                </div>
            </section>
        </div>
    </main>
)}