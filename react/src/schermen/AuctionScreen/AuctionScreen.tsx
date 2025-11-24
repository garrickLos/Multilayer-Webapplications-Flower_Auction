import '../../css/AuctionScreen.css';

export default function AuctionScreen() {
    return (
    <main className='Auction_Body'>
        <section>
            <h2>Artificial Citroen boom in deco pot</h2>
        </section>

        <section>
            <h2>Actn:</h2>
            <h3>A3-36638-132</h3>
        </section>

        <div className="Auction_Container">
            {/* <!-- Schermdeel 1 fotos van producten (nu staan ze vast later moeten ze toegevoegd worden) --> */}
            <section className="Auction_Foto">
                <div className="Auction_fotoContainer">
                    <img src="../../src/assets/pictures/productBloemen/DecoratieveDahliaSunsetFlare.webp" alt="Foto van een bloem" className="Auction_veilingFoto"></img>
                </div>
            </section>

            {/* <!-- Schermdeel 2 product informatie toevoegen --> */}
            <section className="schermDeel2">
                <div className="scherm2Container">
                    <div className="kopje">Product Details</div>
                    <div className="ordenen">
                        <div className="username">Product naam:</div>
                    </div>
                    <div className="ordenen">
                        <div className="productCategorie">Product categorie:</div>
                    </div>
                    <div className="ordenen">
                        <div className="hoeveelheid">Aantal:</div>
                    </div>
                    <div className="ordenen">
                        <div className="Place">Plaats:</div>
                    </div>
                </div>
            </section>

            {/* <!-- Rechter deel van het scherm (miminumprijs en plaats bod) --> */}
            <section className="Auction_schermAankoop">
                <div className="Auction_schermAankoop_container">
                    <div className="Auction_klok">
                        00:00
                    </div>
                    <div className="huidigePrijs">
                        price:
                    </div>
                    <label htmlFor="aantalkopenstuks" className="aantalKopen">Aantal:</label>
                    <input type="number" id="aantalkopenstuks" name="aantalkopenstuks"/>
                    <div className="tekstVoorKopen">Je koopt x voor $y per stuk, in totaal $z.</div>
                    <button className="koopNu">Koop nu!</button>
                </div>
            </section>
        </div>
    </main>
)}