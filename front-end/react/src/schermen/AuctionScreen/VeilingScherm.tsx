import { useEffect, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { Timer } from './Componenten/RenderTimer'; // Zorg dat imports kloppen
import { type errorMessaging, type ProductLogica, type categorie as veilingCategorie, type VeilingLogica, type VeilingschermProps } from './VeilingSchermTypes';

//api calls
import { UseDataApi as GetVeilingen, getBearerToken as Token } from '../../typeScript/ApiGet';
import { UpdateVeilingApi as Api_UpdateVeilingProduct } from '../../typeScript/ApiPost';
import { useAutorefresh as ApiRefresh} from '../../typeScript/ApiRefresh';

//componenten
import { berekenHuidigeVeilingStaat as huidigeVeilingStaat } from './Componenten/RenderTimer';
import { DelenDoor as ConvertToEuro } from '../../typeScript/RekenFuncties';
import { InfoVeld } from './Componenten/InformatieVelden';
import { VeilingProductitem_Update, mapData } from './Componenten/VeilingScherm_InfoConfig';

import '../../css/VeilingScherm.css';

const token = Token();
const Default_ImagePlaceholder = '/src/assets/pictures/webp/MissingPicture.webp';

export default function AuctionScreen() {
    const [toonEindScherm, setToonEindScherm] = useState(false);

    //zorgt ervoor dat er een refresh is voor het ophalen van de api componenten.
    const refreshApi = ApiRefresh(1 * 1000); // milseconden naar seconden * 1000

    // const location = useLocation();
    const { veilingnr } = useParams();
    const veilingItemNr = Number(veilingnr) || 0;

    // Data ophalen
    const { data } = GetVeilingen<VeilingLogica[]>(`/api/Veiling/klant?refresh=${refreshApi}`);
    const safeData = data || [];

    // Data mappen en direct sorteren
    const veilingenLijst = mapData(safeData).sort((a, b) => a.veilingNr - b.veilingNr);
    const actieveVeiling = veilingenLijst.find(v => v.veilingNr === veilingItemNr) || undefined;

    let isAfgelopen = huidigeVeilingStaat(actieveVeiling).isAfgelopen;

    const veilingIsOngeldig = actieveVeiling?.status == 'inactive' || token == null || isAfgelopen;

    const timerInSec = 0.6 * 1000; // van miliseconden naar seconden

    // zodat er een timer is die afteld totdat de error scherm er is nadat een veiling is afgelopen.
    // is er niet opeens een snelle verwijzing naar de homescherm nadat de veiling is afgelopen
    useEffect(() => {
        if (veilingIsOngeldig) {
            const timer = setTimeout(() => {
                setToonEindScherm(true);
            }, timerInSec);

            return () => clearTimeout(timer);
        }
    }, [veilingIsOngeldig]);

    if (veilingIsOngeldig && toonEindScherm) {
        return <GeenVeilingBezig />;
    } else if (actieveVeiling) {
        return (
            <VeilingschermComponent 
                actieveVeiling={actieveVeiling} 
                veilingItemNr={veilingItemNr} 
            />
        );
    } else {
        return <div>Laden...</div>;
    }
}

// voor wanneer de veiling niet gevonden kan worden of als de gebruiker niet is ingelogd.
function GeenVeilingBezig() {
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
function VeilingschermComponent({ actieveVeiling, veilingItemNr }: VeilingschermProps) {

    const [actieveProductIndex, setActieveProductIndex] = useState(0);
    const huidigProduct = getHuidigeProduct(actieveVeiling, actieveProductIndex);

    let [InvoerAantal, setAantal] = useState(0);
    const [huidigePrijs, setHuidigePrijs] = useState(0);
    const aantalFusten = huidigProduct?.aantalFusten;
    const totaalPrijs = (InvoerAantal * huidigePrijs).toFixed(2);
    const categorie = huidigProduct?.categorieNaam;

    const url = `/api/VeilingProduct/${huidigProduct?.veilingProductNr}`;

    const [errors, setErrors] = useState<error>({});

    // Event handlers
    const verwerkVerandering = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAantal(Number(e.target.value));        
    };

    let [koopItem, setKoopItem] = useState<boolean>(true);

    const handleKlik = async () => {

        const isGeldig = checkInputField(InvoerAantal, huidigProduct, errors);
        setKoopItem(isGeldig);
        
        VeilingProductitem_Update(isGeldig, huidigProduct, InvoerAantal, url, token);
    };

    return (
        <main className='Auction_Body'>
            <section>
                <h1>Flora holland veiling: {huidigProduct?.naam}</h1>
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
                        <InfoVeld Titel={'Product naam:'} Bericht={huidigProduct?.naam}
                                BerichtClass={'rightSideText'}/>
                        
                        <InfoVeld Titel={'Product categorie:'} Bericht={categorie}
                                secondClass={'hoeveelheid'} BerichtClass={'rightSideText'}/>
                        
                        <InfoVeld Titel={'AantalFusten:'} Bericht={aantalFusten}
                                secondClass={'hoeveelheid'} BerichtClass={'rightSideText'}/>
                        
                        <InfoVeld Titel={'Plaats:'} Bericht={huidigProduct?.plaats}
                                BerichtClass={'rightSideText'}/>
                    </div>
                </section>

                {/* Rechter deel: Aankoop en Timer */}
                <section className="Auction_schermAankoop">
                    <div className="Auction_schermAankoop_container">
                        <div className="Auction_klok">
                            {/* Hier staat de enige echte Timer die de prijs berekent */}
                            {actieveVeiling ? (
                            <Timer 
                                onPrijsUpdate={setHuidigePrijs}
                                onProductWissel={setActieveProductIndex} // Hier vangen we de wissel af
                                item={actieveVeiling}
                            />
                        ) : (
                            <div>Laden...</div>
                        )}
                        </div>
                        
                        <InfoVeld Titel={'Prijs:'} Bericht={`€ ${huidigePrijs.toFixed(2)}`}
                                BerichtClass={["rightSideText", "Prijs"]}/>

                        <label htmlFor="aantalkopenstuks" className="aantalKopen">Aantal fusten:</label>
                        
                        <input type="number" id="Veiling_aantalkopenstuks" name="aantalkopenstuks selectieVeld" onChange={verwerkVerandering}
                                min={0}
                        />

                        <div>
                            {koopItem == false && 
                            <p className='AuctionScreen_errorInput'>{errors.verkeerdeWaarde}</p>}
                        </div>
                        
                        <div className="tekstVoorKopen">
                            Je koopt {InvoerAantal} voor € {huidigePrijs.toFixed(2)} per stuk, in totaal € {totaalPrijs}.
                        </div>
                        
                        <button className="koopNu" onClick={handleKlik}>Koop nu!</button>
                    </div>
                </section>
            </div>
        </main>
    );
}

function checkInputField(input: number, huidigProduct: ProductLogica, err: errorMessaging) {
    if (input > 0 && input <= huidigProduct.aantalFusten) {
        return true
    } else if (input > huidigProduct.aantalFusten) {
        err.verkeerdeWaarde = "de invoer heeft meer fusten geselecteerd dan mogelijk"
        return false
    }else {
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