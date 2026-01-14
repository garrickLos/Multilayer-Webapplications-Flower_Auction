import { useEffect, useState, useRef } from 'react';
import { InfoVeld } from '../../../Componenten/InformatieVelden';

//import component index
import { getRefreshToken, getBearerToken as Token, ApiRequest} from '../../../Componenten/index';
import { mapInfoLijstData } from '../../Veilingscherm/VeilingSchermComponenten/index'; 

// import index type
import type { PrijsHistorieItemLogica, ContainerSideMenuProps } from '../../Veilingscherm/VeilingSchermComponenten/index';

import '../../../css/Componenten/OffcanvasComponent.css';

/**
 * 
 * @param kwekerNaam Is de naam van de aanvoerder die verbonden is aan het product dat op het moment zichtbaar is in de veiling
 * @param CategorieNr Categorienr van het huidige product in de veiling
 * @param productNaam Naam van het product dat wordt getoond in de veiling
 * @returns De side bar die de informatie bevat die nodig is om het prijsgeschiedenis toont
 */
export function ContainerSideMenu({ kwekerNaam, categorieNr, productNaam }: ContainerSideMenuProps) {

    const [configSpecifiekeData, setConfigSpecifiekeData] = useState<PrijsHistorieItemLogica[]>([]);
    const [configAllKwekerData, setConfigAllKwekerData] = useState<PrijsHistorieItemLogica[]>([]);
    
    const token = Token();
    const refreshToken = getRefreshToken();

    const laatstOpgehaaldeId = useRef<string>("");

    useEffect(() => {
        // Validatie: Stop direct als essentiële gegevens ontbreken
        if (!kwekerNaam || !categorieNr) {
            return;
        }

        const huidigVerzoekId = `${kwekerNaam}-${categorieNr}`;

        // Voorkom dubbele calls voor exact dezelfde data
        if (laatstOpgehaaldeId.current === huidigVerzoekId) {
            return;
        }

        const fetchData = async () => {
            laatstOpgehaaldeId.current = huidigVerzoekId;

            try {
                // roept de Specifieke Kweker gegevens op
                const specifiekeKwekerRaw = await ApiRequest<any>(
                    `/api/PrijsHistorie?CategorieNr=${categorieNr}&bedrijfsNaam=${encodeURIComponent(kwekerNaam)}`, "GET", null, token, refreshToken
                );
                
                const mappedSpecifiekeData = mapInfoLijstData(specifiekeKwekerRaw);
                setConfigSpecifiekeData(mappedSpecifiekeData);

                // roept de algemene kweker gegevens op
                const alleKwekerRaw = await ApiRequest<any>(
                    `/api/PrijsHistorie?CategorieNr=${categorieNr}`, "GET", null, token, refreshToken
                );

                const mappedAlleData = mapInfoLijstData(alleKwekerRaw);
                setConfigAllKwekerData(mappedAlleData);
                    
            } catch (error) {
                console.error("Fout bij ophalen data:", error);
                // reset het als het fout gaat zodat de gegevens opnieuw worden geladen bij volgende poging
                laatstOpgehaaldeId.current = "";
                // zet lege state toe om oude data te voorkomen
                setConfigSpecifiekeData([]);
                setConfigAllKwekerData([]);
            }
        };
        
        fetchData();
    
    }, [kwekerNaam, categorieNr]); // Voeg dependencies toe

    return (
        <div className={`sideBarMenu`}>
            <div className="Auction_Informatievelden_Container aanbieder_informatie">
                <div className="kopje">Aanbieder informatie</div>
                
                <InfoVeld Titel={'Bloemsoort:'} Bericht={productNaam || "Onbekend"} BerichtClass={'rightSideText'}/>
                <InfoVeld Titel={'Aanvoerder:'} Bericht={kwekerNaam || "onbekend"} BerichtClass={'rightSideText'}/>
                <br />

                <InfoVeld Titel={'Historische prijzen van deze aanvoerder:'} />
                {repeatClasses("HuidigeAanbieder", configSpecifiekeData, true , false)}

                <br />

                <InfoVeld Titel={'Historische prijzen van alle aanvoerders:'} />
                {repeatClasses("alleAanbieders", configAllKwekerData, true , true)}
            </div>
        </div>
    );
};

/**
 * @param className naam van de class die de sidebar menu heeft (voor hopelijke herbruikbaarheid)
 * @param data die getoond wordt op de sidebar menu
 * @param renderAanbieder of de aanbieder/aanvoerder toont op de sidebar menu
 * @param renderDate of de datum wordt gerenderd in de sidebar menu
 * @returns een div die alle specifieke informatie toont in de sidebar menu
 */
const repeatClasses = (className: string, data: PrijsHistorieItemLogica[], renderAanbieder: boolean, renderDate: boolean) => {
    if (!data || data.length === 0) {
        return <div className="loading-state">Geen historie gevonden...</div>;
    }

    const totaalPrijs = data.reduce((som, item) => som + (Number(item.bedragPerFust) || 0), 0);
    const aantal = data.length > 0 ? data.length : 1;
    const gemiddelde = (totaalPrijs / aantal).toFixed(2);

    return (
        <div className={className}>
            {/* Laat de titels zien die nodig zijn voor de informatie */}
            <InfoVeld 
                key="header"
                Titel={renderAanbieder && renderDate ? 'Aanvoerder:' : "Datum:"}
                tussenkop={renderAanbieder && renderDate ? 'Datum:' : ""}
                tussenkopClass={ renderAanbieder && renderDate ? "tussenkop" : ""}
                Bericht={"Prijs:"}
                BerichtClass={'rightSideText'}
            />

            {/* Om de specifieke items te tonen op het scherm */}
            {data.map((item, index) => (
                <InfoVeld
                    key={`${className}-${index}`}
                    Titel={renderAanbieder && renderDate ? item.bedrijfsNaam : new Date(item.beginDatum).toLocaleDateString()} 
                    tussenkop={renderAanbieder && renderDate ? new Date(item.beginDatum).toLocaleDateString() : ""} 
                    Bericht={`€ ${Number(item.bedragPerFust).toFixed(2)}`}
                    tussenkopClass={renderDate ? 'tussenkop' : "" } 
                    BerichtClass={'rightSideText'}
                />
            ))}
            <hr style={{ margin: "5px 0" }} />
            {/* laat het gemiddelde zien van de prijzen die zijn opgehaald */}
            <InfoVeld 
                key="footer"
                Titel={'Gemiddelde prijs:'} 
                Bericht={`€ ${gemiddelde}`}
                BerichtClass={'rightSideText'}
            />
        </div>
    );
};