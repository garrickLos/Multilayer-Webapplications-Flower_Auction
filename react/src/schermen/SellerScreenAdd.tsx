import React, { useState } from "react";
import "../css/SellerScreenAdd.css";

export default function SellerScreenAdd() {
    const [product, setProduct] = useState({
        Naam: "",
        Categorie: "",
        Voorraad : "",
        AantalFusten: "",
        Plaats: "",
        MinimalePrijs : "",
        StartDatum: "",
        EindDatum: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        setProduct(prev => ({
            ...prev,
            [id]: type === "number" ? Number(value) : value
        }));
    };

    const handleSubmit = async () => {
        const values = Object.values(product).map(value  =>
            typeof value === "string" ? value.trim() : value
        );

        const isLeeg = values.some(v => v === "");

        if (isLeeg) {
            alert("Een of meer velden zijn leeg!");
            return;
        }

        try {
            const response = await fetch("/api/Tijdelijk", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(product),
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
                                    <label htmlFor="Categorie">Kies categorie:</label>
                                    <select className="Categorie" name="Categorie">
                                        <option value={product.Categorie}>Bloem</option>
                                        <option value={product.Categorie}>Tulp</option>
                                    </select>
                                </div>

                                <div className="ordenen">
                                    <label htmlFor="Voorraad" className="amount">Voorraad:</label>
                                    <input type="number" id="Voorraad"  value={product.Voorraad} onChange={handleChange} />
                                </div>

                                <div className="ordenen">
                                    <label htmlFor="AantalFusten" className="fusten">Aantal fusten:</label>
                                    <input type="number" id="AantalFusten"  value={product.AantalFusten} onChange={handleChange} />
                                </div>

                                <div className="ordenen">
                                    <label htmlFor="Plaats" className="place">Plaats:</label>
                                    <select className="Plaats" value={product.Plaats} onChange={handleChange}>
                                        <option value="Aalsmeer">Aalsmeer</option>
                                        <option value="Rijnsburg">Rijnsburg</option>
                                        <option value="Eelde">Eelde</option>
                                        <option value="Naaldwijk">Naaldwijk</option>
                                    </select>
                                </div>

                                <div className="ordenen">
                                    <label htmlFor="MinimalePrijs" className="minimumPrice">Minimum prijs:</label>
                                    <input type="decimal" id="MinimalePrijs" step="0.01" value={product.MinimalePrijs} onChange={handleChange} />
                                </div>
                            </div>
                        </section>

                        <section className="schermDeel3">
                            <div className="scherm3Container">

                                <div className="scherm3Ordenen">
                                    <label htmlFor="StartDatum" className="sDate">Begin datum:</label>
                                    <input type="date" id="StartDatum" value={product.StartDatum} onChange={handleChange} />
                                </div>

                                <div className="scherm3Ordenen">
                                    <label htmlFor="EindDatum" className="eDate">Eind datum:</label>
                                    <input type="date" id="EindDatum" value={product.EindDatum} onChange={handleChange} />
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