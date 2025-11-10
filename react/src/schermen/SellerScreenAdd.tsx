import React, { useState } from "react";
import "../css/SellerScreenAdd.css";

export default function SellerScreenAdd() {
    const [product, setProduct] = useState({
        name: "",
        category: "",
        amount: "",
        place: "",
        minimumPrice: "",
        startPrice: "",
        startDate: "",
        endDate: "",
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { id, value } = e.target;
        setProduct((prev) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = () => {
        const values = Object.values(product).map((v) => v.trim());
        const isLeeg = values.some((v) => v === "");

        if (isLeeg) {
            alert("Een of meer velden zijn leeg!");
        } else {
            alert("Product is succesvol opgeslagen!");
            console.log("✅ Productgegevens:", product);
        }
    };

    return (
        <main className="SellerScreenAdd">
            <div className="BODY">
                <div className="banner-content">
                    <div className="registratie-knoppen">
                        <button type="button" className="knop-inloggen" aria-label="knop voor het inloggen">
                            inloggen &#10095;
                        </button>
                        <button type="button" className="knop-registreren" aria-label="knop voor registreren van een account">
                            registreren &#10095;
                        </button>
                    </div>
                </div>

                <div className="Mainschermen">
                        <h2>Artificial Citroen boom in deco pot</h2>
                        <div className="ArtikelNummer">
                            <h2>Actn:</h2>
                            <h3>A3-36638-132</h3>
                        </div>

                    <div className="Container">
                        <section className="schermDeel1">
                            <div className="fotoContainer">
                                <img src="../../webp/download.webp" alt="productfoto" className="grote-foto" />
                                <div className="kleine-fotos">
                                    <img src="../../webp/download.webp" alt="productfoto" className="kleine-foto" />
                                    <img src="../../webp/download.webp" alt="productfoto" className="kleine-foto" />
                                    <img src="../../webp/download.webp" alt="productfoto" className="kleine-foto" />
                                </div>
                            </div>
                        </section>

                        <section className="schermDeel2">
                            <div className="scherm2Container">
                                <div className="kopje">Product Details</div>

                                <div className="ordenen">
                                    <label htmlFor="name" className="name">Product name:</label>
                                    <input type="text" id="name" value={product.name} onChange={handleChange} />
                                </div>

                                <div className="ordenen">
                                    <label htmlFor="category" className="category">Product category:</label>
                                    <input type="text" id="category" value={product.category} onChange={handleChange} />
                                </div>

                                <div className="ordenen">
                                    <label htmlFor="amount" className="amount">Amount:</label>
                                    <input type="number" id="amount" value={product.amount} onChange={handleChange} />
                                </div>

                                <div className="ordenen">
                                    <label htmlFor="place" className="place">Place:</label>
                                    <input type="text" id="place" value={product.place} onChange={handleChange} />
                                </div>

                                <div className="ordenen">
                                    <label htmlFor="minimumPrice" className="minimumPrice">Minimum Price:</label>
                                    <input type="number" id="minimumPrice" value={product.minimumPrice} onChange={handleChange} />
                                </div>
                            </div>
                        </section>

                        <section className="schermDeel3">
                            <div className="scherm3Container">
                                <div className="scherm3Ordenen">
                                    <label htmlFor="startPrice" className="price">Start price:</label>
                                    <input type="number" id="startPrice" value={product.startPrice} onChange={handleChange} />
                                </div>

                                <div className="scherm3Ordenen">
                                    <label htmlFor="startDate" className="sDate">Start date:</label>
                                    <input type="date" id="startDate" value={product.startDate} onChange={handleChange} />
                                </div>

                                <div className="scherm3Ordenen">
                                    <label htmlFor="endDate" className="eDate">End date:</label>
                                    <input type="date" id="endDate" value={product.endDate} onChange={handleChange} />
                                </div>

                                <button className="placeProduct" onClick={handleSubmit}>
                                    Place Product
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </main>
    );
}
