import React, { useEffect, useState, useRef } from 'react';
import { Navigate, useParams } from 'react-router-dom';

//api calls
import { getRefreshToken as refreshToken, getBearerToken as Token } from '../../typeScript/ApiGet';
import { useAutorefresh as ApiRefresh} from '../../typeScript/ApiRefresh';
import { ApiRequest } from '../../typeScript/ApiRequest';

//types import van index
import type { VeilingLogica, VeilingschermProps } from './VeilingSchermComponenten/index';
import type { KwekerInfo } from '../hoofdscherm/Componenten/index';

// index componenten imports
import { InfoVeld, GenereerKnop, InputField, checkInputField } from '../../Componenten/index';
import { ContainerSideMenu, Timer, 
    berekenHuidigeVeilingStaat as huidigeVeilingStaat, 
    VeilingProductitem_Update, mapVeilingData } from './VeilingSchermComponenten/index';

import { getKwekerInfo } from '../hoofdscherm/Componenten/index';

// Css voor de veilingscherm
import '../../css/VeilingScherm.css';

let token = Token() || "";
let token_refresh = "";

const Default_ImagePlaceholder = '/src/assets/pictures/webp/MissingPicture.webp';

export default function AuctionScreen() {
    const [toonEindScherm, setToonEindScherm] = useState(false);
    const [actieveVeiling, setActieveVeiling] = useState<any>(null);

    // Zorgt ervoor dat er een refresh is voor het ophalen van de api componenten.
    const refreshApi = ApiRefresh(1 * 1000); 

    const { veilingnr } = useParams();
    const veilingItemNr = Number(veilingnr) || 0;

    token = Token() || "";
    token_refresh = refreshToken() || "";
    
    useEffect(() => {
        const ophalenData = async () => {
            try {

                // 1. Data ophalen (Wacht op de Promise met await)
                const response = await ApiRequest<VeilingLogica>(
                    `/api/Veiling/klant?refresh=${refreshApi}`, "GET", null, token, token_refresh
                );
                
                // Veilig maken van data
                const safeData = Array.isArray(response) ? response : (response ? [response] : []);

                // Mappen en sorteren
                const veilingenLijst = mapVeilingData(safeData).sort((a, b) => a.veilingNr - b.veilingNr);

                // Specifieke veiling zoeken
                const gevondenVeiling = veilingenLijst.find(v => v.veilingNr === veilingItemNr);

                // State updaten (Alleen als er iets gevonden is, of zet null)
                setActieveVeiling(gevondenVeiling || null);

            } catch (error) {
                console.error("Fout bij ophalen data", error);
            }
        };

        ophalenData();

    }, [refreshApi, veilingItemNr]);

    let veilingIsOngeldig = false;

    if (actieveVeiling != null) {
        let isAfgelopen = huidigeVeilingStaat(actieveVeiling).isAfgelopen;

        veilingIsOngeldig= actieveVeiling?.status == 'inactive' || token == null;
    }
    
    const timerInSec = 1 * 1000; // van miliseconden naar seconden

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
        return <Navigate 
                to="/404" 
                replace 
                // We sturen alleen de tekst code 'GeenVeilingBezig' om een specifieke reactie te hebben
                state={{ foutType: 'GeenVeilingBezig' }} 
            />;
    } else if (actieveVeiling) {
        return (
            <VeilingschermComponent 
                actieveVeiling={actieveVeiling} 
                veilingItemNr={veilingItemNr} 
            />
        );
    // als er geen token is gevonden dan gaat het naar de 404 pagina
    } else if (sessionStorage.getItem('token') == null) {
        return (
            <Navigate 
                to="/404" 
                replace 
                // We sturen alleen de tekst code 'sessieVerlopen' om een specifieke reactie te hebben
                state={{ foutType: 'sessieVerlopen' }} 
            />
        );
    }
}

//voor de veilingscherm zelf, wanneer de gebruiker naar een veiling wilt gaan.
function VeilingschermComponent({ actieveVeiling, veilingItemNr }: VeilingschermProps) {

    const [actieveProductIndex, setActieveProductIndex] = useState(0);
    const huidigProduct = getHuidigeProduct(actieveVeiling, actieveProductIndex);

    const [InvoerAantal, setAantal] = useState<number | string>(0);
    const [huidigePrijs, setHuidigePrijs] = useState(0);
    const aantalFusten = huidigProduct?.aantalFusten;
    
    const rekenAantal = InvoerAantal === "" ? 0 : Number(InvoerAantal);
    const totaalPrijs = (rekenAantal * huidigePrijs).toFixed(2);
    
    const categorie = huidigProduct?.categorieNaam;

    const [kweker, setKweker] = useState<KwekerInfo | null > (null);

    const getVeilingProductUrl = `/api/VeilingProduct/${huidigProduct?.veilingProductNr}`;

    // Event handlers
    const verwerkVerandering = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rauweInvoer = e.target.value;
        const max = huidigProduct?.aantalFusten || 0;

        // Als de invoer leeg is, update de state naar "" en stop.
        if (rauweInvoer === "") {
            setAantal("");
            return;
        }

        // Valideren (ik ga ervan uit dat checkInputField een getal of string teruggeeft)
        const gecorrigeerdeWaarde = checkInputField(rauweInvoer, max);
        
        // Zet het resultaat in de state
        setAantal(gecorrigeerdeWaarde);
    };

    const handleKlik = async () => {
        
        token = Token() || "";
        token_refresh = refreshToken() || "";

        // Validatie bij versturen: Gebruik 'rekenAantal' of check op > 0
        const definitiefAantal = Number(InvoerAantal);

        if (huidigProduct != null && definitiefAantal > 0) {
            try {
                await VeilingProductitem_Update(huidigProduct, actieveVeiling.veilingNr, definitiefAantal, // Stuur het nummer, niet de string
                    Number(totaalPrijs), getVeilingProductUrl, token, token_refresh
                );
            } catch (error) {
                console.log("Fout bij updaten", error);
            }
        } else {
            console.log("Geen geldig aantal ingevuld");
        }
    };

    const [isOpen] = React.useState(true);

    const dataIsOpgehaald = useRef(false);

    useEffect(() => {

        if (dataIsOpgehaald.current || !isOpen) return;
        const fetchKweker = async () => {
            // Als er geen kwekerNr is, stoppen we
            if (!huidigProduct?.kwekerNr) return;

            try {
                console.log("Kweker halen");
                const data = await getKwekerInfo(huidigProduct.kwekerNr);
                if (data != null) {
                    setKweker(data);
                }
            } catch (err) {
                console.error("Fout bij ophalen kweker:", err);
            }
        };
        fetchKweker();

    // Deze effect runt opnieuw als het product (en dus de kweker) verandert
    }, [huidigProduct?.kwekerNr]);

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
                            <div>
                                Laden...</div>
                        )}
                        </div>
                        
                        <InfoVeld Titel={'Prijs:'} Bericht={`€ ${huidigePrijs.toFixed(2)}`}
                                BerichtClass={["rightSideText", "Prijs"]}/>

                        <span className="aantalKopen">Aantal fusten:</span>
                        
                        <InputField type={'number'} id={'Veiling_aantalkopenstuks'} name={'aantalkopenstuks selectieVeld'} 
                            onChange={verwerkVerandering} value={InvoerAantal} />
                        
                        <div className="tekstVoorKopen">
                            Je koopt {InvoerAantal} voor € {huidigePrijs.toFixed(2)} per stuk, in totaal € {totaalPrijs}.
                        </div>
                        
                        <GenereerKnop classNames={'Button koopNu'} bericht='Koop nu!' onclickAction={handleKlik}/>
                    </div>

                    <div className='SideMenuInfo'>
                        <div className='SideMenuInfo'>
                            <ContainerSideMenu 
                                isOpen={isOpen} 
                                kwekerNaam={kweker?.bedrijfsNaam} 
                                categorieNr={huidigProduct?.categorieNr} 
                                productNaam={huidigProduct?.naam}
                            />
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