import { useEffect, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { Timer } from '../AuctionScreen/RenderTimer'; // Zorg dat imports kloppen
import { type categorie as veilingCategorie, type VeilingLogica } from '../AuctionScreen/VeilingTypes';
import { UseDataApi as GetVeilingen, getBearerToken as Token } from '../../typeScript/ApiGet';
import { useAutorefresh as ApiRefresh} from '../../typeScript/ApiRefresh';

import '../../css/AuctionScreen.css';

const token = Token();
const Default_ImagePlaceholder = '/src/assets/pictures/webp/MissingPicture.webp';

type error = {
    verkeerdeWaarde?: string;
};

export default function AuctionScreen() {
    //zorgt ervoor dat er een refresh is voor het ophalen van de api componenten.
    const refreshApi = ApiRefresh(1000);

    // const location = useLocation();
    const { veilingnr } = useParams();
    const veilingItemNr = Number(veilingnr) || 0;

    const [actieveProductIndex, setActieveProductIndex] = useState(0);
    const [aantal, setAantal] = useState(0);
    const [huidigePrijs, setHuidigePrijs] = useState(0);

    // Data ophalen
    const { data } = GetVeilingen<VeilingLogica[]>(`/api/Veiling/klant?refresh=${refreshApi}`);
    const safeData = data || [];

    // Data mappen en direct sorteren
    const veilingenLijst = mapData(safeData).sort((a, b) => a.veilingNr - b.veilingNr);
    const activeVeiling = veilingenLijst.find(v => v.veilingNr === veilingItemNr) || null;
    const huidigProduct = getHuidigeProduct(activeVeiling, actieveProductIndex);

    const [errors, setErrors] = useState<error>({});

    // Event handlers
    const verwerkVerandering = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAantal(Number(e.target.value));        
    };

    const totaalPrijs = (aantal * huidigePrijs).toFixed(2);

    const { data: catData } = GetVeilingen<veilingCategorie>(`/api/Categorie/${huidigProduct?.categorieNr}`);
    const categorie = catData || null;

    let [koopItem, setKoopItem] = useState<boolean>(false);

    const handleKlik = () => {
        const resultaat = checkInputField(aantal, errors);
        setKoopItem(resultaat);
    };

    if (activeVeiling?.status == 'inactive' || token == null) {
        return geenVeilingGeplaatst();
    } else {
        return Veilingscherm(errors);
}

// voor wanneer de veiling niet gevonden kan worden of als de gebruiker niet is ingelogd.
function geenVeilingGeplaatst() {
    return (
        <main className='Auction_Body'>
            <div id='AuctionScreen_state-container'>
                <h1>Geen veiling gevonden.</h1>
                <p>Het is mogelijk dat de veiling is afgelopen, niet meer bestaat of dat u niet bent ingelogd.</p>
                <NavLink to={"/home"} className={"button"}>terug naar hoofdscherm</NavLink>
            </div>
        </main>
    )
}

//voor de veilingscherm zelf, wanneer de gebruiker naar een veiling wilt gaan.
function Veilingscherm(errors: error) {
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
                            <div className="productCategorie">Product categorie: {categorie?.naam}</div>
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
                        <input type="number" id="Veiling_aantalkopenstuks" name="aantalkopenstuks selectieVeld" onChange={verwerkVerandering}
                                min={0}
                        />

                        <div>
                            {koopItem == true}
                            {koopItem == false && <p className='AuctionScreen_errorInput'>{errors.verkeerdeWaarde}</p>}
                        </div>
                        
                        <div className="tekstVoorKopen">
                            Je koopt {aantal} voor € {huidigePrijs.toFixed(2)} per stuk, in totaal € {totaalPrijs}.
                        </div>
                        
                        <button className="koopNu" onClick={handleKlik}>Koop nu!</button>
                    </div>
                </section>
            </div>
        </main>
    );
    }
}

function checkInputField(input: number, err: error) {
    if (input > 0) {
        return true
    } else {
        err.verkeerdeWaarde = "Minimale input van 1 verwacht";
        return false;
    }
}

function getHuidigeProduct(activeVeiling: VeilingLogica, actieveProductIndex: number) {

    let actieveVeiling = activeVeiling && activeVeiling.producten[actieveProductIndex] 
        ? activeVeiling.producten[actieveProductIndex] 
        : null;

    return actieveVeiling;
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