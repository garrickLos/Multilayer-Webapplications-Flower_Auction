import "../css/SellerScreenInfo.css";
import {GetDataApi as GetProducten} from "../typeScript/ApiGetVeilingItems.tsx";

export default function SellerScreenInfo() {
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
                            <div className="hoeveelheid">Hoeveelheid bloemen: {Product.map(p => p.VoorraadBloemen)}</div>
                            <div className="aantalFusten">Aantal fusten: {Product.map(p => p.AantalFusten)}</div>
                        </div>
                        <div className="plaats">Plaats:</div>
                    </div>
                </section>
            </main>
        );
}
