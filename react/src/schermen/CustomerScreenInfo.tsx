import "../css/CustomerScreenInfo.css";

export default function CustomerScreenInfo() {

    return(
        <main className="SellerScreenInfo">
            <section className="rij">
                <div className="kolomLinks">
                    <img src="../../src/assets/pictures/productBloemen/DecoratieveDahliaSunsetFlare.webp" alt="bloem"
                         className="fotoProduct"/>
                </div>
                <div className="kolomRechts">
                    <div className="linkerHelft">
                        <div className="productNaam">Product naam:</div>
                        <div className="productCategorie">Product categorie:</div>
                    </div>
                    <div className="rechterHelft">
                        <div className="hoeveelheid">Totale hoeveelheid bloemen:</div>
                        <div className="aantalFusten">Aantal geboden fusten:</div>
                    </div>
                    <div className="plaats">Plaats:</div>
                </div>
            </section>
        </main>
    );
}
