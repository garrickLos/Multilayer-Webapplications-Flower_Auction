import "../css/SellerScreenInfo.css";
import { UseDataApi as GetProduct } from "../typeScript/ApiGet";

export default function SellerScreenInfo() {
    const { data: ProductData } = GetProduct('/api/Veilingproduct/kweker');
    const productLijst = (ProductData as ProductType[]) || [];

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
    console.log(productLijst.map(c=>c.plaats));
    return (
        <main className="SellerScreenInfo">
            <section className="productScroller">
                {productLijst.map((product) => (
                    <div key={product.veilingProductNr} className="rij">
                        <div className="kolomLinks">
                            <img
                                src={product.imagePath}
                                alt={product.naam}
                                className="fotoProduct"
                            />
                        </div>
                        <div className="kolomRechts">
                                <div className="productNaam">Product naam: {product.naam}</div>
                                <div className="productCategorie">Product categorie: {product.categorie}</div>
                                <div className="datum">Geplaatst op: {product.geplaatstDatum.replace("T", " om ")} uur</div>
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
