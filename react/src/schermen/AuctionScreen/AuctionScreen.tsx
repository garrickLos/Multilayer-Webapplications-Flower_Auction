import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Timer } from '../AuctionScreen/RenderTimer'; // Zorg dat imports kloppen
import { type categorie as veilingCategorie, type VeilingLogica } from '../AuctionScreen/VeilingTypes';
import { UseDataApi as GetVeilingen } from '../../typeScript/ApiGet';

import '../../css/AuctionScreen.css';

export default function AuctionScreen() {
    // const location = useLocation();
    const { veilingnr } = useParams();
    const veilingItemNr = Number(veilingnr) || 0;

    const [actieveProductIndex, setActieveProductIndex] = useState(0);

    // State declaraties (Horen altijd bovenin de component)
    const [refreshApi, setRefreshApi] = useState(Date.now());
    const [aantal, setAantal] = useState(0);
    const [huidigePrijs, setHuidigePrijs] = useState(0);

    // Data ophalen
    const { data } = GetVeilingen<VeilingLogica[]>(`/api/Veiling?rol=klant&refresh=${refreshApi}`);
    const safeData = data || [];

    // API Refresh interval
    useEffect(() => {
        const apiInterval = setInterval(() => {
            setRefreshApi(Date.now());
        }, 1000);
        return () => clearInterval(apiInterval);
    }, []);

    // Event handlers
    const verwerkVerandering = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAantal(Number(e.target.value));        
    };

    const totaalPrijs = (aantal * huidigePrijs).toFixed(2);

    // Data mappen en direct sorteren
    const veilingenLijst = mapData(safeData).sort((a, b) => a.veilingNr - b.veilingNr);
    
    const activeVeiling = veilingenLijst.find(v => v.veilingNr === veilingItemNr) || null;

    const huidigProduct = activeVeiling && activeVeiling.producten[actieveProductIndex] 
        ? activeVeiling.producten[actieveProductIndex] 
        : null;

    const { data: catData } = GetVeilingen<veilingCategorie[]>(`/api/Categorie/${huidigProduct?.categorieNr}`);
    const categorie = catData || [];

    const Default_ImagePlaceholder = '/src/assets/pictures/webp/MissingPicture.webp';

    console.log(activeVeiling);

    if (activeVeiling?.status == 'inactive') {
        return geenVeilingPlaats();
    } else {
        return (
        <main className='Auction_Body'>
            <section>
                <h2>Artificial Citroen boom in deco pot</h2>
            </section>

            <section>
                <h2>Actn: {huidigProduct?.veilingProductNr}</h2>
                <h3>VeilingNummer: {veilingItemNr}</h3>
            </section>

            <div className="Auction_Container">
                <section className="Auction_Foto">
                    <div className="Auction_fotoContainer">
                        <img src={huidigProduct?.imagePath == undefined ? Default_ImagePlaceholder : huidigProduct?.imagePath} alt="Foto van een bloem" className="Auction_veilingFoto"></img>
                    </div>
                </section>

                {/* Schermdeel 2: Product Info */}
                <section className="schermDeel2">
                    <div className="scherm2Container">
                        <div className="kopje">Product Details</div>
                        <div className="ordenen">
                            <div className="username">
                            Product naam: {huidigProduct?.naam}
                        </div>
                        </div>
                        <div className="ordenen">
                            <div className="productCategorie">Product categorie: {categorie.naam}</div>
                        </div>
                        <div className="ordenen">
                            <div className="hoeveelheid">AantalFusten: {huidigProduct?.aantalFusten} </div>
                        </div>
                        <div className="ordenen">
                            <div className="hoeveelheid">Vooraad bloemen: {huidigProduct?.voorraadBloemen}</div>
                        </div>
                        <div className="ordenen">
                            <div className="Place">Plaats: {huidigProduct?.plaats}</div>
                        </div>
                    </div>
                </section>

                {/* Rechter deel: Aankoop en Timer */}
                <section className="Auction_schermAankoop">
                    <div className="Auction_schermAankoop_container">
                        <div className="Auction_klok">
                            {/* Hier staat de enige echte Timer die de prijs berekent */}
                            {activeVeiling ? (
                            <Timer 
                                onPrijsUpdate={setHuidigePrijs}
                                onProductWissel={setActieveProductIndex} // Hier vangen we de wissel af
                                item={activeVeiling}
                            />
                        ) : (
                            <div>Laden...</div>
                        )}
                        </div>
                        
                        <div className="huidigePrijs">
                            Price: € {huidigePrijs.toFixed(2)}
                        </div>

                        <label htmlFor="aantalkopenstuks" className="aantalKopen">Aantal:</label>
                        <input type="number" id="Veiling_aantalkopenstuks" name="aantalkopenstuks selectieVeld" onChange={verwerkVerandering}/>
                        
                        <div className="tekstVoorKopen">
                            Je koopt {aantal} voor € {huidigePrijs.toFixed(2)} per stuk, in totaal € {totaalPrijs}.
                        </div>
                        
                        <button className="koopNu">Koop nu!</button>
                    </div>
                </section>
            </div>
        </main>
    );
    }
}

function geenVeilingPlaats() {
    return (
        <main className='Auction_Body'>
            <div>
                <h1>Geen veiling</h1>
            </div>
        </main>
    )
}

function mapData(safeData: any[]): VeilingLogica[] {
    return safeData.map((item) => ({
        veilingNr: item.veilingNr,
        status: item.status,
        startIso: item.begintijd,
        endIso: item.eindtijd,
        
        producten: (item.producten || []).map((prod: any) => ({
            veilingProductNr: prod.veilingProductNr || prod.VeilingProductNr || 0,
            naam: prod.naam,
            
            categorieNr: prod.CategorieNr || prod.categorieNr || 0, 
            
            aantalFusten: prod.AantalFusten || prod.aantalFusten || 'aantal fusten is niet bekend',
            voorraadBloemen: prod.VoorraadBloemen || prod.voorraadBloemen || 'voorraad is niet gevonden',
            
            startPrijs: prod.startprijs || 'startprijs is niet bekend',
            minPrijs: prod.Minimumprijs || prod.minimumprijs || 'prijs is onbekend',

            plaats: prod.Plaats || prod.plaats || "Onbekende plaats",
            imagePath: prod.ImagePath || prod.imagePath || ""
        }))
    }));
}