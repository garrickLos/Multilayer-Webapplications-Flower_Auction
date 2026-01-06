import { useEffect, useState } from 'react';
import { Navigate, NavLink, useParams } from 'react-router-dom';
import { Timer } from '../../Componenten/RenderTimer'; // Zorg dat imports kloppen
import { type errorMessaging, type ProductLogica, type VeilingLogica, type VeilingschermProps } from './VeilingSchermTypes';

//api calls
import { getRefreshToken as refreshToken, UseDataApi as GetVeilingen, getBearerToken as Token } from '../../typeScript/ApiGet';
import { useAutorefresh as ApiRefresh} from '../../typeScript/ApiRefresh';

//componenten
import { checkInputField } from '../../Componenten/InputVeld';
import { berekenHuidigeVeilingStaat as huidigeVeilingStaat } from '../../Componenten/RenderTimer';
import { InfoVeld } from '../../Componenten/InformatieVelden';
import { VeilingProductitem_Update, mapData } from './VeilingSchermComponenten/VeilingScherm_InfoConfig';
import { GenereerKnop } from '../../Componenten/Knop';


import '../../css/VeilingScherm.css';

const token = Token() || "";
const token_refresh = refreshToken() || "";
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
    const actieveVeiling = veilingenLijst.find(v => v.veilingNr === veilingItemNr) || null;

    let veilingIsOngeldig = false;

    if (actieveVeiling != null) {
        let isAfgelopen = huidigeVeilingStaat(actieveVeiling).isAfgelopen;

        veilingIsOngeldig= actieveVeiling?.status == 'inactive' || token == null || isAfgelopen;
    }
    
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
    } else if (sessionStorage.getItem('token') == null) {
        return (
            <Navigate 
                to="/404" 
                replace 
                // We sturen alleen de tekst code 'sessieVerlopen'
                state={{ foutType: 'sessieVerlopen' }} 
            />
        );
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

    // Event handlers
    const verwerkVerandering = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rauweInvoer = e.target.value;
        const max = huidigProduct?.aantalFusten || 0;

        // Valideer en corrigeer de invoer direct
        const gecorrigeerdeWaarde = checkInputField(rauweInvoer, max);

        const waardeVoorState = gecorrigeerdeWaarde === "" ? 0 : gecorrigeerdeWaarde;
        
        setAantal(waardeVoorState);
    };

    const handleKlik = async () => {

        if (huidigProduct != null && InvoerAantal > 0) {
            try {
                VeilingProductitem_Update(huidigProduct, InvoerAantal, Number(totaalPrijs), url, token, token_refresh);
            } catch (error) {
                console.log("geen item ingevuld");
            }
        }
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
                <section className="Auction_Informatievelden">
                    <div className="Auction_Informatievelden_Container">
                        <div className="kopje">Product Details</div>
                        <InfoVeld Titel={'Product naam:'} Bericht={huidigProduct?.naam}
                                BerichtClass={'rightSideText'}/>
                        
                        <InfoVeld Titel={'Product categorie:'} Bericht={categorie}
                                secondClass={'hoeveelheid'} BerichtClass={'rightSideText'}/>
                        
                        <InfoVeld Titel={'AantalFusten:'} Bericht={aantalFusten}
                                secondClass={'hoeveelheid'} BerichtClass={'rightSideText'}/>
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

                        <span className="aantalKopen">Aantal fusten:</span>
                        
                        <input type="number" id="Veiling_aantalkopenstuks" name="aantalkopenstuks selectieVeld" onChange={verwerkVerandering}
                            min={0} value={InvoerAantal}
                        />
                        
                        <div className="tekstVoorKopen">
                            Je koopt {InvoerAantal} voor € {huidigePrijs.toFixed(2)} per stuk, in totaal € {totaalPrijs}.
                        </div>
                        
                        <GenereerKnop classNames={'Button koopNu'} bericht='Koop nu!' onclickAction={handleKlik}/>
                    </div>
                </section>

                <section>
                    <div className="Auction_Informatievelden_Container aanbieder_informatie">
                        <div className="kopje">Aanbieder informatie</div>
                        <InfoVeld Titel={'Bloemsoort:'} Bericht={huidigProduct?.naam}
                                BerichtClass={'rightSideText'}/>
                        
                        <InfoVeld Titel={'Aanvoerder: '} Bericht={"**kweker naam hier**"}
                                BerichtClass={'rightSideText'}/>

                        <br></br>
                        
                        <InfoVeld Titel={'Historische prijzen van deze aanbieder (laatste 10)'} />

                        <InfoVeld Titel={'Aanbieder: '} Bericht={"**kweker naam hier**"}
                                BerichtClass={'rightSideText'}/>

                        <div className='HuidigeAanbieder'>
                            <InfoVeld Titel={'Datum:'} Bericht={"Prijs:"}
                                BerichtClass={'rightSideText'}/>

                            <InfoVeld Titel={'**Datum**'} Bericht={"1 euro"}
                                BerichtClass={'rightSideText'}/>
                            <InfoVeld Titel={'**Datum**'} Bericht={"2 euro"}
                                BerichtClass={'rightSideText'}/>
                            <InfoVeld Titel={'**Datum**'} Bericht={"3 euro"}
                                BerichtClass={'rightSideText'}/>
                            <InfoVeld Titel={'**Datum**'} Bericht={"4 euro"}
                                BerichtClass={'rightSideText'}/>
                            <InfoVeld Titel={'**Datum**'} Bericht={"5 euro"}
                                BerichtClass={'rightSideText'}/>
                            <InfoVeld Titel={'**Datum**'} Bericht={"6 euro"}
                                BerichtClass={'rightSideText'}/>
                            <InfoVeld Titel={'**Datum**'} Bericht={"7 euro"}
                                BerichtClass={'rightSideText'}/>
                            <InfoVeld Titel={'**Datum**'} Bericht={"8 euro"}
                                BerichtClass={'rightSideText'}/>
                            <InfoVeld Titel={'**Datum**'} Bericht={"9 euro"}
                                BerichtClass={'rightSideText'}/>
                            <InfoVeld Titel={'**Datum**'} Bericht={"10 euro"}
                                BerichtClass={'rightSideText'}/>
                            <InfoVeld Titel={'Gemiddelde prijs alle historische order van de **insert kweker**:'} Bericht={"**insert gemiddelde**"}
                                BerichtClass={'rightSideText'}/>
                        </div>
                        <br></br>

                        <InfoVeld Titel={'Historische prijzen van alle aanbieder (laatste 10)'} />

                        <InfoVeld Titel={'Aanbieder: '} Bericht={"**kweker naam hier**"}
                                BerichtClass={'rightSideText'}/>
                        <div className='alleAanbieders'>
                            <InfoVeld Titel={'Aanbieder:'} tussenkop={'Datum:'} Bericht={"Prijs:"}
                                BerichtClass={'rightSideText'}/>

                            <InfoVeld Titel={'**Aanbieder**'} tussenkop={'**Datum**'} Bericht={"1 euro"}
                                tussenkopClass={'tussenkop'} BerichtClass={'rightSideText'}/>
                            <InfoVeld Titel={'**Aanbieder**'} tussenkop={'**Datum**'} Bericht={"2 euro"}
                                tussenkopClass={'tussenkop'} BerichtClass={'rightSideText'}/>
                            <InfoVeld Titel={'**Aanbieder**'} tussenkop={'**Datum**'} Bericht={"2 euro"}
                                tussenkopClass={'tussenkop'} BerichtClass={'rightSideText'}/>
                            <InfoVeld Titel={'**Aanbieder**'} tussenkop={'**Datum**'} Bericht={"4 euro"}
                                tussenkopClass={'tussenkop'} BerichtClass={'rightSideText'}/>
                            <InfoVeld Titel={'**Aanbieder**'} tussenkop={'**Datum**'} Bericht={"5 euro"}
                                tussenkopClass={'tussenkop'} BerichtClass={'rightSideText'}/>
                            <InfoVeld Titel={'**Aanbieder**'} tussenkop={'**Datum**'} Bericht={"6 euro"}
                                tussenkopClass={'tussenkop'} BerichtClass={'rightSideText'}/>
                            <InfoVeld Titel={'**Aanbieder**'} tussenkop={'**Datum**'} Bericht={"7 euro"}
                                tussenkopClass={'tussenkop'} BerichtClass={'rightSideText'}/>
                            <InfoVeld Titel={'**Aanbieder**'} tussenkop={'**Datum**'} Bericht={"8 euro"}
                                tussenkopClass={'tussenkop'} BerichtClass={'rightSideText'}/>
                            <InfoVeld Titel={'**Aanbieder**'} tussenkop={'**Datum**'} Bericht={"9 euro"}
                                tussenkopClass={'tussenkop'} BerichtClass={'rightSideText'}/>
                            <InfoVeld Titel={'**Aanbieder**'} tussenkop={'**Datum**'} Bericht={"10 euro"}
                                tussenkopClass={'tussenkop'} BerichtClass={'rightSideText'}/>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}

function getHuidigeProduct(activeVeiling: VeilingLogica, actieveProductIndex: number) {

    let actieveVeiling = activeVeiling && activeVeiling.producten[actieveProductIndex] 
        ? activeVeiling.producten[actieveProductIndex] 
        : null;

    return actieveVeiling;
}