import { useEffect, useState } from "react";
import "../css/CustomerScreenInfo.css";
import { resolveImageUrl } from "../config/api";

import { ApiRequest } from '../Componenten/index';



export default function CustomerScreenInfo() {
    //lijst van biedingen van de huidige gebruiker en lijst van producten van de api
    const [biedingLijst, setBiedingLijst] = useState<BiedingType[]>([]);
    const [productLijst, setProductLijst] = useState<ProductType[]>([]);

    const refreshtoken = sessionStorage.getItem("refreshToken");
    const token = sessionStorage.getItem("token");

    const nummer = sessionStorage.getItem("gebruikerNummer")
    if(!nummer)
    {
        return null;
    }

    //biedingen op halen gebaseerd op gebruikerNr en die opslaan in de lijst
    useEffect(() => {
    const dataOphalen = async () => {
    const response = await ApiRequest<BiedingType[]>(
      `/api/Bieding/klant?gebruikerNr=${nummer}`,
      "GET",
      null,
      token,
      refreshtoken
    );

    const biedingLijst = response as BiedingType[];
    setBiedingLijst(biedingLijst);
    };

    dataOphalen();
    }, [refreshtoken]);

    //productinformatie ophalen gebaseerd op veilingproductNr en die opslaan in de lijst
    useEffect(() => {
    const dataOphalen = async () => {
    const response = await ApiRequest<ProductType[]>(
      '/api/Veilingproduct/klant',
      "GET",
      null,
      token,
      refreshtoken
    );

    const productLijst = response as ProductType[];
    setProductLijst(productLijst);
    };

    dataOphalen();
    }, [refreshtoken]);


    //beschrijft hoe elk product en bieding object eruit ziet
    interface BiedingType {
        aantalStuks: number;
        bedragPerFust: number;
        gebruikerNr: number;
        veilingProductNr: number;
    }
    interface ProductType {
        veilingProductNr: number; 
        naam: string;
        categorie: string | null; 
        imagePath: string; 
        plaats: string; 
    }

    //huidige gebruikernummer omzetten naar een int
    const nieuweNummer = Number.parseInt(nummer, 10);

    //filtert biedinglijst zodat alleen biedingen van de ingelogde gebruiker te zien zijn
    const mijnBiedingen = biedingLijst.filter(v => v.gebruikerNr === nieuweNummer);

    //loopt door elke bieding van de gebruiker en vind de bijbehorende product in productlijst.
    return (
        <main className="SellerScreenInfo">
            <section className="productScroller">
                
                {mijnBiedingen.map((bieding) => {
                    const product = productLijst.find(
                        (p) => p.veilingProductNr === bieding.veilingProductNr
                    );
                    if (!product) return null; 
                    return (
                        <div key={bieding.gebruikerNr} className="rij">
                            <div className="kolomLinks">
                                { <img src={resolveImageUrl(product.imagePath)} alt={product.naam} className="fotoProduct" /> }
                            </div>
                            <div className="kolomRechts">
                                <div className="linkerHelft">
                                    <div className="productNaam">Product naam: {product.naam}</div>
                                    <div className="productCategorie">Product categorie: {product.categorie}</div>
                                </div>
                                <div className="rechterHelft">
                                    <div className="hoeveelheid">
                                        Totaal aantal bloemen gekocht: {bieding.aantalStuks}
                                    </div>
                                    <div className="totalePrijs">
                                        Totaal betaald: {(bieding.bedragPerFust * bieding.aantalStuks)} euro
                                    </div>
                                    <div className="plaats">Plaats: {product.plaats}</div>
                                </div>
                            </div>
                        </div>
                    );
                })
            }
            </section>
        </main>

    );
}
