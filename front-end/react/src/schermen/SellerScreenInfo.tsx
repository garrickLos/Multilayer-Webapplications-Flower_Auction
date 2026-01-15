import "../css/SellerScreenInfo.css";
import { NavLink } from 'react-router-dom';
import { resolveImageUrl } from "../config/api";
import { useEffect, useState } from "react";
import { ApiRequest } from '../Componenten/index';


export default function SellerScreenInfo() {
    //haalt de gebruikernummer op om producten te vinden van de ingelogde kweker
    const refreshtoken = sessionStorage.getItem("refreshToken");
    const token = sessionStorage.getItem("token");

    const nummer = sessionStorage.getItem("gebruikerNummer")
    if(!nummer)
    {
        return null;
    }

    const [productLijst, setProductLijst] = useState<ProductType[]>([]);
    

    //productinformatie ophalen gebaseerd op veilingproductNr en die opslaan in de lijst
        useEffect(() => {
        const dataOphalen = async () => {
        const response = await ApiRequest<ProductType[]>(
          `/api/Veilingproduct/kweker?Nummer=${nummer}`,
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

    //beschrijft hoe elk product object eruit ziet
    interface ProductType {
        veilingProductNr: number;
        naam: string;
        geplaatstDatum: string;
        fust: number;
        voorraad: number | string;
        categorie: string;
        imagePath: string;
        plaats: string;
    } 

    return (
        <main className="SellerScreenInfo">
            <div className="productToevoegenKnop_container">    
                <NavLink to='/productPlaatsen'
                className="productToevoegenKnop">Product toevoegen</NavLink>
            </div>
            <section className="productScroller">
                {productLijst.length < 1 ?(
                    <div className="geenInfo">Er zijn nog geen producten toegevoegd.</div>
                ) :
                (productLijst.map((product) => (
                    <div key={product.veilingProductNr} className="rij">
                        <div className="kolomLinks">
                            <img
                                src={resolveImageUrl(product.imagePath)}
                                alt={product.naam}
                                className="fotoProduct"
                            />
                        </div>
                        <div className="kolomRechts">
                                <div className="productNaam">Product naam: {product.naam}</div>
                                <div className="productCategorie">Product categorie: {product.categorie}</div>
                                <div className="datum">Geplaatst op: {product.geplaatstDatum.split("T")[0]}</div>
                                <div className="hoeveelheid">Hoeveelheid bloemen: {product.voorraad}</div>
                                <div className="aantalFusten">Aantal fusten: {product.fust}</div>
                                <div className="plaats">Plaats: {product.plaats}</div>
                        </div>
                    </div>
                ))
            )}
            </section>
        </main>
    );
}
