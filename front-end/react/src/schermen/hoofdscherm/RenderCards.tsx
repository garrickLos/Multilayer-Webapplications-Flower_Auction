'use client';
import { useState, useEffect } from "react";
import { GenereerKnop } from "../../Componenten/Knop";
import { DelenDoor as SetEuro } from "../../typeScript/RekenFuncties";
import { GetDate } from "../../typeScript/FetchDate";

// api import
import { ApiRequest } from '../../typeScript/ApiRequest.tsx';

// css
import '../../css/Componenten/AuctionCards.css';

// to do: verplaatsen van types naar een specifieke folder en bestand
interface AuctionCardProps {
    parentVeiling: VeilingItem;
    product: Producten;
}

export interface VeilingItem {
    veilingNr: number;
    begintijd: string;
    eindtijd: string;
    status: string;
    minimumPrijs: number;
    producten: Producten[]; // Meestal is dit een array
}

export interface Producten {
    veilingProductNr: number;
    naam: string;
    startprijs: number;
    aantalFusten: number;
    imagePath?: string;
    beschrijving?: string;
    gebruikerNr: number;
}

interface KwekerInfo {
    bedrijfsNaam?: string; 
}

const Default_ImagePlaceholder = '/src/assets/pictures/webp/MissingPicture.webp';

export function AuctionCard({ product, parentVeiling }: AuctionCardProps) {

    // Stopt de item als de product of veliing niet gevonden kan worden en vult de kaart met een laadscherm
    if (!product || !parentVeiling) {
        return <div className="RenderCard">Item laden...</div>;
    }

    // States pas initialiseren NA de guard clause
    const [currentSrc, setCurrentSrc] = useState(product.imagePath || Default_ImagePlaceholder);
    const [hasError, setHasError] = useState(false);
    const [kweker, setKweker] = useState<KwekerInfo | null > (null);

    const handleError = () => {
        setCurrentSrc(Default_ImagePlaceholder);
        setHasError(true);
    };

    useEffect(() => {
        async function fetchKweker() {
            if (!product.gebruikerNr) return;

            try {
                const data = await getKwekerInfo(product.gebruikerNr);
                if (data != null){
                    setKweker(data);
                }

            } catch (err) {
                console.error("Fout bij ophalen kweker:", err);
            }
        }
        fetchKweker();

    }, [product.gebruikerNr]);

    return (
        <div className='RenderCard grid-item'>
            <img 
                src={currentSrc} 
                alt={`De foto laat zien: ${product.naam}`} 
                onError={handleError} 
            />
            
            <div className='RenderCard_text-container'>
                {hasError && <p className='ImageErrorMsg'>foto kan niet gevonden worden</p>}
                
                <h3>{product.naam || 'Geen Titel'}</h3>
                
                <p className='Description'>
                    {kweker 
                        ? beschrijving(product, parentVeiling, kweker) 
                        : "Laden van kweker informatie..."}
                </p>
            </div>

            <GenereerKnop 
                classNames={'Button'} 
                bericht={'naar de veiling'} 
                to={`/auction/${parentVeiling.veilingNr}`} 
            />
        </div>
    );
}

// creert een beschrijving die gebruikt wordt in de rendercard zelf
export function beschrijving(product: Producten, item: VeilingItem, kwekerInfo: KwekerInfo) {   
    // Gebruik kwekerNaam of naam afhankelijk van je API response
    const kwekerNaam = kwekerInfo.bedrijfsNaam || "Onbekende aanvoerder";

    // de items die worden getoond als een grote tekst onder de foto
    return (
        `lot nr: ${item.veilingNr}, product nr: ${product.veilingProductNr}, aanvoerder: ${kwekerNaam}

        Fusten over: ${product.aantalFusten}
        
        prijs begint op: ${SetEuro(product.startprijs, 100).toFixed(2)} euro
        veiling starttijd: ${GetDate(item.begintijd, 'nl-NL')}`
    );
}

export async function getKwekerInfo(gebruikerNr: number) {
    const aanvoerderUrl: string = `/api/Gebruiker/kwekerNaam?GebruikerNr=${gebruikerNr}`;

    try {
        // haalt de kwekerInfo op (anonymous) om de naam op te halen.
        const data = await ApiRequest<KwekerInfo>(aanvoerderUrl, "GET", null, null, null);

        return data;
    } catch (error: any) {
        // error handling
        console.error(error.message);
    }
}