import "../css/SellerScreenInfo.css";
import { UseDataApi as GetProduct } from "../Componenten/ApiGet";
import { NavLink } from 'react-router-dom';
import { resolveImageUrl } from "../config/api";


export default function SellerScreenInfo() {
    const nummer = sessionStorage.getItem("gebruikerNummer");
    console.log("gebruikernummer: " + nummer);
    const { data: ProductData } = GetProduct(`/api/Veilingproduct/kweker?Nummer=${nummer}`);
    const productLijst = (ProductData as ProductType[]) || [];
    console.log(productLijst);

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
                {productLijst.map((product) => (
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
                ))}
            </section>
        </main>
    );
}
