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
    categorieNr?: number;
}

export function ContainerSideMenu({ isOpen, categorieNr: number }: ContainerSideMenuProps) {

    // VERANDERING 1: State gebruiken in plaats van een losse variabele
    // We initialiseren het als een lege array of null zodat de map functies niet crashen voor de data er is.
    const [configdData, setConfigdData] = useState<any[]>([]);
    
    const token = Token();
    const refreshToken = getRefreshToken();

    // VERANDERING 2: useEffect gebruiken voor side-effects (data fetchen)
    useEffect(() => {
        const fetchData = async () => {
            if (!isOpen) return;

            try {
                const data = await ApiRequest<any>(`http://localhost:5105/PrijsHistorie?CategorieNr=${2}`, "GET", null, token, refreshToken);

                const safeData = Array.isArray(data) ? data : (data ? [data] : []);
                const promiseArray = mapInfoLijstData(safeData);

                setConfigdData(promiseArray);
                
            } catch (error) {
                console.error("Fout bij ophalen data", error);
            }
        };

        fetchData();

    }, [isOpen]);

    // DEBUG 4: Check wanneer de component opnieuw rendert met nieuwe data
    useEffect(() => {
        console.log("State is geüpdatet naar:", configdData);
    }, [configdData]);

    return (
        <div className={`sideBarMenu ${isOpen ? 'open' : 'closed'}`}>
            <div className="Auction_Informatievelden_Container aanbieder_informatie sideBarMenu">
                <div className="kopje">Aanbieder informatie</div>
                
                <InfoVeld Titel={'Bloemsoort:'} Bericht={"huidigProduct?.naam"} BerichtClass={'rightSideText'}/>
                <InfoVeld Titel={'Aanvoerder: '} Bericht={"**kweker naam hier**"} BerichtClass={'rightSideText'}/>
                <br />

                <InfoVeld Titel={'Historische prijzen van deze aanbieder'} />
                
                {/* Oproep 1: Huidige aanbieder (zonder footer/gemiddelde als voorbeeld, of true als je dat wel wilt) */}
                {repeatClasses("HuidigeAanbieder", configdData, true)}

                <br />

                <InfoVeld Titel={'Historische prijzen van alle aanbieders'} />

                {/* Oproep 2: Alle aanbieders (met footer/gemiddelde) */}
                {repeatClasses("alleAanbieders", configdData, true)}

            </div>
        </div>
    );
};

const repeatClasses = (className: string, data: any[], showFooter: boolean) => {
    // Veiligheidscheck: render niets als er geen data is
    if (!data || !Array.isArray(data) || data.length === 0) return <div>Geen data beschikbaar</div>;

    // 1. BEREKENINGEN (Voor de footer)
    // We berekenen het totaal en gemiddelde voor de footer
    const totaalPrijs = data.reduce((som, item) => som + (Number(item.bedragPerFust) || 0), 0);
    const gemiddelde = (totaalPrijs / data.length).toFixed(2); // 2 decimalen

    return (
        <div className={className}>
            {/* --- HEADER: De kolomnamen --- */}
            {/* Dit toont 'Aanbieder', 'Datum', 'Prijs' dikgedrukt boven de lijst */}
            <InfoVeld 
                key="header"
                Titel={'Aanbieder:'} 
                tussenkop={'Datum:'} 
                Bericht={"Prijs:"}
                BerichtClass={'rightSideText'}
                // Voeg hier eventueel styling toe om het dikgedrukt te maken
            />
            <hr style={{ margin: "5px 0" }} /> {/* Optioneel lijntje onder header */}

            {/* --- BODY: De data items --- */}
            {data.map((item, index) => (
                <InfoVeld
                    key={`${className}-${index}`}
                    Titel={item.bedrijfsNaam} 
                    tussenkop={new Date(item.beginDatum).toLocaleDateString()} // Datum netjes formatteren
                    Bericht={`€ ${item.bedragPerFust}`}
                    
                    tussenkopClass={'tussenkop'} 
                    BerichtClass={'rightSideText'}
                />
            ))}

            {/* --- FOOTER: Gemiddelde of afsluiting --- */}
            {showFooter && (
                <>
                    <hr style={{ margin: "5px 0" }} />
                    <InfoVeld 
                        key="footer"
                        Titel={'Gemiddelde prijs over deze periode:'} 
                        Bericht={`€ ${gemiddelde}`}
                        BerichtClass={'rightSideText'}
                    />
                </>
            )}
        </div>
    );
};

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