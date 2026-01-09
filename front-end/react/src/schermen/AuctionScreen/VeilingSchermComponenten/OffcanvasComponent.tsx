import { useEffect, useState, useRef } from 'react';
import { InfoVeld } from '../../../Componenten/InformatieVelden';

import { ApiRequest } from '../../../typeScript/ApiRequest';
import { getRefreshToken, getBearerToken as Token } from '../../../typeScript/ApiGet';
import { mapInfoLijstData } from '../../AuctionScreen/VeilingSchermComponenten/VeilingScherm_InfoConfig';

import type { PrijsHistorieItemLogica, ContainerSideMenuProps } from '../../AuctionScreen/VeilingSchermComponenten/index';

import '../../../css/Componenten/OffcanvasComponent.css';

export function ContainerSideMenu({ isOpen, kwekerNaam, categorieNr, productNaam }: ContainerSideMenuProps) {

    const [configSpecifiekeData, setConfigSpecifiekeData] = useState<PrijsHistorieItemLogica[]>([]);
    const [configAllKwekerData, setConfigAllKwekerData] = useState<PrijsHistorieItemLogica[]>([]);
    
    const token = Token();
    const refreshToken = getRefreshToken();

    const laatstOpgehaaldeId = useRef<string>("");

    useEffect(() => {
        // Validatie: Stop direct als essentiële gegevens ontbreken
        if (!isOpen || !kwekerNaam || !categorieNr) {
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
    
    }, [isOpen, kwekerNaam, categorieNr]); // Voeg dependencies toe

    return (
        <div className={`sideBarMenu ${isOpen ? 'open' : 'closed'}`}>
            <div className="Auction_Informatievelden_Container aanbieder_informatie">
                <div className="kopje">Aanbieder informatie</div>
                
                <InfoVeld Titel={'Bloemsoort:'} Bericht={productNaam || "Onbekend"} BerichtClass={'rightSideText'}/>
                <InfoVeld Titel={'Aanvoerder:'} Bericht={kwekerNaam || "onbekend"} BerichtClass={'rightSideText'}/>
                <br />

                <InfoVeld Titel={'Historische prijzen van deze aanbieder'} />
                {repeatClasses("HuidigeAanbieder", configSpecifiekeData)}

                <br />

                <InfoVeld Titel={'Historische prijzen van alle aanbieders'} />
                {repeatClasses("alleAanbieders", configAllKwekerData)}
            </div>
        </div>
    );
};

const repeatClasses = (className: string, data: PrijsHistorieItemLogica[]) => {
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
                Titel={'Aanbieder:'}
                tussenkop={'Datum:'}
                tussenkopClass={"tussenkop"}
                Bericht={"Prijs:"}
                BerichtClass={'rightSideText'}
            />
            {/* Om de specifieke items te tonen op het scherm */}
            {data.map((item, index) => (
                <InfoVeld
                    key={`${className}-${index}`}
                    Titel={item.bedrijfsNaam} 
                    tussenkop={new Date(item.beginDatum).toLocaleDateString()} 
                    Bericht={`€ ${Number(item.bedragPerFust).toFixed(2)}`}
                    tussenkopClass={'tussenkop'} 
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