import React, { useState } from "react";
import "../css/SellerScreenAdd.css";

export default function SellerScreenAdd() {
    //Lijst van mogelijke plaats opties
    const MogelijkePlaatsen = ["Aalsmeer", "Rijnsburg", "Eelde", "Naaldwijk"];
    
    //Vaste data (voor nu)
    const Data = {
        GeplaatstDatum: "2025-11-17T10:16:37.880",
        VeilingNr: 201,
        Startprijs: 4,
        status: true,
        Kwekernr: 1,
        ImagePath: "../../src/assets/pictures/productBloemen/DecoratieveDahliaSunsetFlare.webp"
    }
    
    //Data die veranderd door de input van de gebruiker
    const [product, setProduct] = useState({
        Naam: "",
        AantalFusten: 1,
        VoorraadBloemen: 1,
        CategorieNr: 1,
        Plaats: "",
        Minimumprijs: 1,
        beginDatum: ""
    });
    
    //Kopieert de bestaande waardes en veranderd het
    const GebruikerInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value, type } = e.target;
        setProduct(prev => ({
            ...prev,
            [id]: type === "number" ? Number(value) : value
        }));
    };

    const GegevensVersturen = async () => {
        //Voegt de 2 soorten waardes samen die worden meegegeven met POST
        const AlleGegevens  = {
            ...Data,
            ...product
        }

        //Verwijderd spaties
        const values = Object.values(product).map(value =>
            typeof value === "string" ? value.trim() : value
        );
       
        //Controleert of een input leeg is
        const isLeeg = values.some(v => v === "");
        
         if (isLeeg) {
            alert("Een of meer velden zijn leeg!");
            return;
        }
         
         //Verstuurt een POST verzoek naar de API
        try {
            console.log(product.Plaats);
            const response = await fetch("/api/Veilingproduct", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(AlleGegevens),
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
                                <img src="../../src/assets/pictures/productBloemen/DecoratieveDahliaSunsetFlare.webp" alt="productfoto" className="grote-foto" />
                            </div>
                        </section>

                        <section className="schermDeel2">
                            <div className="scherm2Container">
                                <div className="kopje">Product informatie</div>
                                <div className="ordenen">
                                    <label htmlFor="Naam" className="name">Product naam:</label>
                                    <input type="text" id="Naam"  value={product.Naam} onChange={GebruikerInput}/>
                                </div>

                                <div className="ordenen">
                                    <label htmlFor="CategorieNr" className="categorie">Categorie:</label>
                                    <input type="number" id="CategorieNr" min="1" value={product.CategorieNr} onChange={GebruikerInput} />
                                </div>

                                <div className="ordenen">
                                    <label htmlFor="VoorraadBloemen" className="amount">Voorraad:</label>
                                    <input type="number" id="VoorraadBloemen"  value={product.VoorraadBloemen} onChange={GebruikerInput}/>
                                </div>

                                <div className="ordenen">
                                    <label htmlFor="AantalFusten" className="fusten">Aantal fusten:</label>
                                    <input type="number" id="AantalFusten" min="1" value={product.AantalFusten} onChange={GebruikerInput}/>
                                </div>

                                <div className="ordenen">
                                    <label htmlFor="plaats">Plaats:</label>
                                    <select id="Plaats" value={product.Plaats} onChange={GebruikerInput}>
                                        <option value="">selecteer een plaats</option> 
                                        {MogelijkePlaatsen.map((plaats, index) => (
                                            <option key={index} value={plaats}>{plaats}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="ordenen">
                                    <label htmlFor="Minimumprijs" className="minimumPrice">Minimum prijs:</label>
                                    <input type="number" id="Minimumprijs" step="0.01" value={product.Minimumprijs} onChange={GebruikerInput}/>
                                </div>
                            </div>
                        </section>

                        <section className="schermDeel3">
                            <div className="scherm3Container">
                                <div className="scherm3Ordenen">
                                    <label htmlFor="beginDatum" className="sDate">Begin datum:</label>
                                    <input type="date" id="beginDatum" value={product.beginDatum} onChange={GebruikerInput} />
                                </div>

                                <button className="placeProduct" onClick={GegevensVersturen}>
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
