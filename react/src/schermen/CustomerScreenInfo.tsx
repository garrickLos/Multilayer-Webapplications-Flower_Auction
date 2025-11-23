import "../css/CustomerScreenInfo.css";
import {GetDataApi as GetProducten} from "../typeScript/ApiGetVeilingItems.tsx";

export default function CustomerScreenInfo() {
    const {ApiElement: Product } = GetProducten('api/Veilingproduct');

    return(
        <main className="SellerScreenInfo">
            <section className="rij">
                <div className="kolomLinks">
                    <img src="../../src/assets/pictures/productBloemen/DecoratieveDahliaSunsetFlare.webp" alt="bloem"
                         className="fotoProduct"/>
                </div>
                <div className="kolomRechts">
                    <div className="linkerHelft">
                        <div className="productNaam">Product naam: {Product.map(p => p.Naam)}</div>
                        <div className="productCategorie">Product categorie: {Product.map(p => p.Categorie.Naam)}</div>
                    </div>
                    <div className="rechterHelft">
                        <div className="hoeveelheid">Totale hoeveelheid bloemen: {Product.map(p => p.VoorraadBloemen)}</div>
                        <div className="aantalFusten">Aantal geboden fusten: {Product.map(p => p.AantalFusten)}</div>
                    </div>
                    <div className="plaats">Plaats:</div>
                </div>
            </section>
        </main>
    );
}
