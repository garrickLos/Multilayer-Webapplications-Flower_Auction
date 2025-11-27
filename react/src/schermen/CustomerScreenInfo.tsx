import "../css/CustomerScreenInfo.css";
import { UseDataApi as GetProduct } from "../typeScript/ApiGet";
import { UseDataApi as GetBieding } from "../typeScript/ApiGet";


export default function CustomerScreenInfo() {
    const { data: ProductData } = GetProduct('/api/Veilingproduct/klant ');
    const productLijst = (ProductData as ProductType[]) || [];

    const { data: BiedingData } = GetBieding('/api/Bieding/klant');
    const biedingLijst = (BiedingData as BiedingType[]) || [];

    interface BiedingType {
        aantalStuks: number;
        bedragPerFust: number;
        gebruikerNr: number;
        veilingProductNr: number;
    }
    interface ProductType {
        veilingProductNr: number; 
        naam: string;
        categorie: string; 
        imagePath: string; 
        plaats: string; 
    }
    console.log(biedingLijst);
    return (
        <main className="SellerScreenInfo">
            <section className="productScroller">
                {biedingLijst.map((bieding) => {
                    const product = productLijst.find(
                        (p) => p.veilingProductNr === bieding.veilingProductNr
                    );
                    if (!product) return null; 
                    return (
                        <div key={bieding.gebruikerNr} className="rij">
                            <div className="kolomLinks">
                                { <img src={product.imagePath} alt={product.naam} className="fotoProduct" /> }
                            </div>
                            <div className="kolomRechts">
                                    <div className="productNaam">Product naam: {product.naam}</div>
                                    <div className="productCategorie">Product categorie: {product.categorie}</div>
                                    <div className="hoeveelheid">
                                        Totaal aantal bloemen gekocht: {bieding.aantalStuks}
                                    </div>
                                    <div className="totalePrijs">
                                        Totaal betaald: {(bieding.bedragPerFust * bieding.aantalStuks)} euro
                                    </div>
                                    <div className="plaats">Plaats: {product.plaats}</div>
                            </div>
                        </div>
                    );
                })}
            </section>
        </main>

    );
}
