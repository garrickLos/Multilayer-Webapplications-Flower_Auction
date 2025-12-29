import { useEffect } from "react";
import type { VeilingLogica } from "../schermen/AuctionScreen/VeilingSchermTypes";
import { DelenDoor as convertToEuro } from "../typeScript/RekenFuncties";

type TimerProps =  {
    onPrijsUpdate: (prijs: number) => void;
    onProductWissel: (productIndex: number) => void; // Nieuwe prop
    item: VeilingLogica;
}

// Hulpfunctie: Bereken de gegevens van het huidige actieve product
export function berekenHuidigeVeilingStaat(veiling: VeilingLogica) {
    if (!veiling || !veiling.producten || veiling.producten.length === 0) {
        return { prijs: 0, index: -1, isAfgelopen: true };
    }

    const startTijd = veiling.startIso ? new Date(veiling.startIso).getTime() : Date.now();
    const eindTijd = veiling.endIso ? new Date(veiling.endIso).getTime() : Date.now();
    const nu = Date.now();
    
    // Veiling is nog niet begonnen
    if (nu < startTijd && nu < eindTijd) {
        return { 
            prijs: veiling.producten[0].startPrijs / 100, 
            index: 0, 
            isAfgelopen: false 
        };
    }

    let resterendeVerstrekenTijd = Math.floor((nu - startTijd) / 1000); // Tijd in seconden
    const dalingPerSeconde = 1; // 1 cent daling per seconde (standaard bloemenveiling)

    // Loop door de producten heen om te kijken welke nu "bezig" is
    for (let i = 0; i < veiling.producten.length; i++) {
        const product = veiling.producten[i];

        if (Number(product.aantalFusten) <= 0) {
            continue;
        }

        let startprijs = product.startPrijs;
        let minimumPrijs = product.minPrijs;
        
        const prijsVerschil = startprijs - minimumPrijs;
        const productDuurSec = Math.floor(prijsVerschil / dalingPerSeconde);
        
        // Zitten we binnen de tijd van DIT product?
        if (resterendeVerstrekenTijd < productDuurSec) { 
            const huidigeDaling = resterendeVerstrekenTijd * dalingPerSeconde;
            const actuelePrijs = startprijs - huidigeDaling;

            return {
                prijs: Number(convertToEuro(actuelePrijs, 100).toFixed(2)),
                index: i,
                isAfgelopen: false
            };
        }

        // Dit product is klaar (tijd is op, minimumprijs bereikt).
        // We trekken de duur van dit product af van de verstreken tijd en gaan naar de volgende loop.
        resterendeVerstrekenTijd -= productDuurSec;
    }

    // Als we hier komen, zijn alle producten geweest
    // als de loop eindigd en er zijn geem producten met fusten meer over
    return {
        prijs: 0,
        index: veiling.producten.length - 1,
        isAfgelopen: true
    };
}

export function Timer({ onPrijsUpdate, onProductWissel, item }: TimerProps) {
    // Elke render de berekening opnieuw doen
    const status = berekenHuidigeVeilingStaat(item);

    // Effect om updates naar de parent te sturen (alleen als waarden veranderen)
    useEffect(() => {
        onPrijsUpdate(status.prijs);
        onProductWissel(status.index);
    }, [status.prijs, status.index, onPrijsUpdate, onProductWissel]);

    return (
        <div className="veiling-klok">
             {/* Als de veiling is afgelopen, toon een tekst, anders de prijs */}
            {status.isAfgelopen ? (
                <p className="klok-einde">VEILING GESLOTEN</p>
            ) : (
                <p>€ {status.prijs.toFixed(2)}</p>
            )}
        </div>
    );
}