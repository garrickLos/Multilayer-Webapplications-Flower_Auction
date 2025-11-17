import React, { useState } from "react";
import "../css/SellerScreenAdd.css";

export default function SellerScreenAdd() {
    const [product, setProduct] = useState({
        Naam: "",
        CategorieNr: 1,
        VoorraadBloemen: 0,
        AantalFusten: 0,
        Plaats: "",
        Minimumprijs: 0,
        beginDatum: "",
        Startprijs: 2.5,
        VeilingNr: 201,
        Kwekernr: 42, // correct veldnaam
        status: true,
        ImagePath: "string"
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        setProduct(prev => ({
            ...prev,
            [id]: type === "number" ? Number(value) : value
        }));
    };

    const handleSubmit = async () => {
        const values = Object.values(product).map(value =>
            typeof value === "string" ? value.trim() : value
        );

        const isLeeg = values.some(v => v === "");

        if (isLeeg) {
            alert("Een of meer velden zijn leeg!");
            return;
        }

        try {
            const response = await fetch("/api/Veilingproduct", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...product,
                    beginDatum: new Date(product.beginDatum) // verstuur als Date
                }),
            });

            if (response.ok) {
                alert("Product toegevoegd!");
                const data = await response.json();
                console.log(data);
            } else {
                alert("Fout bij toevoegen product!");
            }
        } catch (error) {
            console.error(error);
            alert("Netwerk fout");
        }
    };

    return (
        <main className="SellerScreenAdd">
            <div className="BODY">
                <div className="Mainschermen">
                    <h2>Kunstmatig Citroen boom in deco pot</h2>
                    <div className="ArtikelNummer">
                        <h2>Artikel nummer:</h2>
                        <h3>A3-36638-132</h3>
                    </div>

                    <div className="Container">
                        <section className="schermDeel1">
                            <div className="fotoContainer">
                                <img src="/src/assets/pictures/webp/bloem.webp" alt="productfoto" className="grote-foto" />
                                <div className="kleine-fotos">
                                    <img src="/src/assets/pictures/webp/bloem.webp" alt="productfoto" className="kleine-foto" />
                                    <img src="/src/assets/pictures/webp/bloem.webp" alt="productfoto" className="kleine-foto" />
                                    <img src="/src/assets/pictures/webp/bloem.webp" alt="productfoto" className="kleine-foto" />
                                </div>
                            </div>
                        </section>

                        <section className="schermDeel2">
                            <div className="scherm2Container">
                                <div className="kopje">Product informatie</div>

                                <div className="ordenen">
                                    <label htmlFor="Naam" className="name">Product naam:</label>
                                    <input type="text" id="Naam" value={product.Naam} onChange={handleChange} />
                                </div>

                                <div className="ordenen">
                                    <label htmlFor="CategorieNr" className="categorie">Categorie:</label>
                                    <input type="number" id="CategorieNr" value={product.CategorieNr} onChange={handleChange} />
                                </div>

                                <div className="ordenen">
                                    <label htmlFor="VoorraadBloemen" className="amount">Voorraad:</label>
                                    <input type="number" id="VoorraadBloemen" value={product.VoorraadBloemen} onChange={handleChange} />
                                </div>

                                <div className="ordenen">
                                    <label htmlFor="AantalFusten" className="fusten">Aantal fusten:</label>
                                    <input type="number" id="AantalFusten" value={product.AantalFusten} onChange={handleChange} />
                                </div>

                                <div className="ordenen">
                                    <label htmlFor="Plaats" className="plaats">Plaats:</label>
                                    <input type="text" id="Plaats" value={product.Plaats} onChange={handleChange} />
                                </div>

                                <div className="ordenen">
                                    <label htmlFor="Minimumprijs" className="minimumPrice">Minimum prijs:</label>
                                    <input type="number" id="Minimumprijs" step="0.01" value={product.Minimumprijs} onChange={handleChange} />
                                </div>
                            </div>
                        </section>

                        <section className="schermDeel3">
                            <div className="scherm3Container">
                                <div className="scherm3Ordenen">
                                    <label htmlFor="beginDatum" className="sDate">Begin datum:</label>
                                    <input type="date" id="beginDatum" value={product.beginDatum} onChange={handleChange} />
                                </div>

                                <button className="placeProduct" onClick={handleSubmit}>
                                    Product Plaatsen
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </main>
    );
}
