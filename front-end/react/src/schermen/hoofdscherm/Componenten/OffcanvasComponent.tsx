import { useEffect, useState } from 'react';
import { InfoVeld } from '../../../Componenten/InformatieVelden';

import '../../../css/Componenten/OffcanvasComponent.css';
import { ApiRequest } from '../../../typeScript/ApiRequest';
import { getRefreshToken, getBearerToken as Token } from '../../../typeScript/ApiGet';
import { mapInfoLijstData } from '../../AuctionScreen/VeilingSchermComponenten/VeilingScherm_InfoConfig';


export interface PrijsHistorieItemLogica {
    bedrijfsNaam: string;
    beginDatum: string;
    bedragPerFust: number;
}

// Interface voor het hoofdresultaat (komt overeen met PrijsHistorieResultaat)
export interface PrijsHistorieResultaatLogica {
    items: PrijsHistorieItemLogica[];
    averageBedrag: number | null;
}

interface ContainerSideMenuProps {
    isOpen: boolean;
}

export function ContainerSideMenu ( {isOpen}: ContainerSideMenuProps ) {

    const [kwekerHistorie, setKwekerHistorie] = useState<PrijsHistorieResultaatLogica[]>([]);
    const [alleHistorie, setAlleHistorie] = useState<PrijsHistorieResultaatLogica[]>([]);

    const normaliseerResultaten = (data: unknown): PrijsHistorieResultaatLogica[] => {
        const arrayData = Array.isArray(data) ? data : data ? [data] : [];
        return mapInfoLijstData(arrayData as PrijsHistorieResultaatLogica[]);
    };
    
    useEffect(() => {
        const haalDataOp = async () => {
            const token = Token();
            const refreshToken = getRefreshToken();

            try {
                const [alleData, kwekerData] = await Promise.all([
                    ApiRequest<any>("/api/PrijsHistorie", "GET", null, token, refreshToken),
                    ApiRequest<any>("/api/PrijsHistorie/kweker", "GET", null, token, refreshToken),
                ]);

                setAlleHistorie(normaliseerResultaten(alleData));
                setKwekerHistorie(normaliseerResultaten(kwekerData));

            } catch (error) {
                console.error("Fout bij ophalen data", error);
            }
        };

        if (isOpen) {
            haalDataOp();
        }
    }, [isOpen]);    

    return (
        // Hier voegen we de class 'open' toe als isOpen true is
        <div className={`sideBarMenu ${isOpen ? 'open' : 'closed'}`}>
            <div className="Auction_Informatievelden_Container aanbieder_informatie sideBarMenu">
                <div className="kopje">Aanbieder informatie</div>
                <InfoVeld Titel={'Bloemsoort:'} Bericht={"huidigProduct?.naam"}
                    BerichtClass={'rightSideText'}/>
                        
                <InfoVeld Titel={'Aanvoerder: '} Bericht={"**kweker naam hier**"}
                    BerichtClass={'rightSideText'}/>

                <br></br>

                <InfoVeld Titel={'Historical prices of this grower (last 10)'} />

                {repeatClasses("HuidigeAanbieder", kwekerHistorie, false)}

                <br></br>

                    <InfoVeld Titel={'Historische prijzen van alle aanbieder (laatste 10)'} />

                {repeatClasses("alleAanbieders", alleHistorie, true)}

                {/* <div className='alleAanbieders'>
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

                    <InfoVeld Titel={'Gemiddelde prijs alle historische order van de **insert kweker**:'} Bericht={"**insert gemiddelde**"}
                        BerichtClass={'rightSideText'}/>
                </div> */}
            </div>
        </div>
    );
};

export function repeatClasses(
    className: string, 
    resultatenLijst: PrijsHistorieResultaatLogica[], 
    toonDatumKolom: boolean = false 
) {
    if (!resultatenLijst) return null;

    return (
        <>
            {resultatenLijst.map((resultaat, resultaatIndex) => {
                
                // Als we meerdere aanbieders tonen, is de naam in de footer algemeen. 
                // Anders pakken we de naam van de specifieke kweker.
                const footerNaam = toonDatumKolom 
                    ? "alle aanbieders" 
                    : (resultaat.items.length > 0 ? resultaat.items[0].bedrijfsNaam : "Onbekende kweker");

                return (
                    <div className={className} key={`historie-blok-${resultaatIndex}`}>
                        
                        {/* 1. De Header (Dynamisch) */}
                        <InfoVeld 
                            // Als toonAanbiederKolom true is, is de titel 'Aanbieder', anders 'Datum'
                            Titel={toonDatumKolom ? 'Aanbieder:' : 'Datum:'}
                            
                            // Alleen tussenkop tonen als we in de 'alle aanbieders' modus zitten
                            tussenkop={toonDatumKolom ? 'Datum:' : undefined}
                            
                            Bericht={"Prijs:"}
                            BerichtClass={'rightSideText'}
                        />

                        {/* 2. De Items */}
                        {resultaat.items.map((item, itemIndex) => (
                            <InfoVeld
                                key={`${resultaatIndex}-${itemIndex}-${item.beginDatum}`}
                                
                                // In 'alle aanbieders' modus is de Titel de bedrijfsnaam. Anders de datum.
                                Titel={toonDatumKolom 
                                    ? item.bedrijfsNaam 
                                    : new Date(item.beginDatum).toLocaleDateString('nl-NL')
                                }

                                // De tussenkop (Datum) wordt alleen gebruikt in de 'alle aanbieders' modus
                                tussenkop={toonDatumKolom 
                                    ? new Date(item.beginDatum).toLocaleDateString('nl-NL') 
                                    : undefined
                                }
                                tussenkopClass={toonDatumKolom ? 'tussenkop' : undefined}

                                Bericht={`${item.bedragPerFust} euro`}
                                BerichtClass={'rightSideText'}
                            />
                        ))}

                        {/* 3. De Footer */}
                        <InfoVeld 
                            Titel={`Gemiddelde prijs alle historische order van ${footerNaam}:`} 
                            Bericht={resultaat.averageBedrag !== null ? `€ ${resultaat.averageBedrag}` : "Onbekend"}
                            BerichtClass={'rightSideText'}
                        />
                    </div>
                );
            })}
        </>
    );
}

// export const ParentComponent = () => {
    

//     return (
//         <>
//         <div className='SidebarParent'>
//                 <div style={{ padding: '20px' }}>
//                     <h3>Hoofd Content</h3>
                    
//                 </div>

//                 <ContainerSideMenu isOpen={isOpen} />
//             </div>
//         </>
//     );
// }