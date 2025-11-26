import "../css/CustomerScreenInfo.css";
import { UseDataApi as GetProduct } from "../typeScript/ApiGet";
import { UseDataApi as GetBieding } from "../typeScript/ApiGet";


export default function CustomerScreenInfo() {
    const { data: ProductData } = GetProduct('/api/Veilingproduct');
    const productLijst = (ProductData as ProductType[]) || [];

    const { data: BiedingData } = GetBieding('/api/Bieding');
    const biedingLijst = (BiedingData as BiedingType[]) || [];

    interface BiedingType {
        biedNr: number;
        aantalStuks: number;
        bedragPerFust: number;
        gebruikerNr: number;
        veilingNr: number;
        veilingProductNr: number;
    }
    interface ProductType {
        veilingProductNr: number; //
        naam: string;//
        geplaatstDatum: string;
        fust: number;
        voorraad: number | string;
        startprijs: number;
        categorie: string | null; 
        veilingNr: number;
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
                        <div key={bieding.biedNr} className="rij">
                            <div className="kolomLinks">
                                { <img src={product.imagePath} alt={product.naam} className="fotoProduct" /> }
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
                })}
            </section>
        </main>

    );
}
