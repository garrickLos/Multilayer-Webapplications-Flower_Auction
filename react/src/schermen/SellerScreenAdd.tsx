import React, { useState } from "react";
import "../css/SellerScreenAdd.css";
import { UseDataApi as GetCategorie } from "../typeScript/ApiGet";

// 1. We definiëren hoe een Categorie eruitziet
interface CategorieType {
    categorieNr: number; // Was CategorieNr
    naam: string;
}

export default function SellerScreenAdd() {
    const mogelijkePlaatsen = ["Aalsmeer", "Rijnsburg", "Eelde", "Naaldwijk"];
    
    // 2. We vertellen TypeScript dat 'data' een lijst van CategorieType is
    const { data } = GetCategorie('/api/Categorie');
    const categorieLijst = (data as CategorieType[]) || [];

    const basisData = {
        GeplaatstDatum: "2025-11-17T10:16:37.880",
        VeilingNr: 201,
        Startprijs: 4,
        status: true,
        Kwekernr: 1,
        ImagePath: "../../src/assets/pictures/productBloemen/DecoratieveDahliaSunsetFlare.webp"
    }
    
    const [product, setProduct] = useState({
        Naam: "",
        AantalFusten: 1,
        VoorraadBloemen: 1,
        CategorieNr: "",
        Plaats: "",
        Minimumprijs: 1,
        beginDatum: ""
    });
    
    const verwerkInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value, type } = e.target;
        
        // We controleren of het veld een getal moet zijn.
        // Een <select> heeft namelijk NIET type="number".
        const isGetalVeld = type === "number" || id === "CategorieNr" || id === "AantalFusten" || id === "VoorraadBloemen";

        setProduct(prev => ({
            ...prev,
            // Als het een getalveld is en de waarde is niet leeg, converteer naar Number. Anders behoud value.
            [id]: isGetalVeld && value !== "" ? Number(value) : value
        }));
    };

    const gegevensVersturen = async () => {
        const alleGegevens = {
            ...basisData,
            ...product
        }

        const values = Object.values(product).map(value =>
            typeof value === "string" ? value.trim() : value
        );
       
        const isLeeg = values.some(v => v === "");
        
        if (isLeeg) {
            alert("Een of meer velden zijn leeg!");
            return;
        }
         
        try {
            console.log(alleGegevens);

            const response = await fetch("/api/Veilingproduct", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(alleGegevens),
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
                                    <input type="text" id="Naam" value={product.Naam} onChange={verwerkInput}/>
                                </div>
                                
                                <div className="ordenen">
                                    <label htmlFor="CategorieNr">Categorie:</label>
                                    <select id="CategorieNr" value={product.CategorieNr} onChange={verwerkInput}>
                                        <option value="">selecteer een categorie</option>
                                        {/* Nu weet TypeScript dat categorieLijst een array is */}
                                        {categorieLijst.map(c => (
                                            <option key={c.categorieNr} value={c.categorieNr}>{c.naam}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="ordenen">
                                    <label htmlFor="VoorraadBloemen" className="amount">Voorraad:</label>
                                    <input type="number" id="VoorraadBloemen" value={product.VoorraadBloemen} onChange={verwerkInput}/>
                                </div>

                                <div className="ordenen">
                                    <label htmlFor="AantalFusten" className="fusten">Aantal fusten:</label>
                                    <input type="number" id="AantalFusten" min="1" value={product.AantalFusten} onChange={verwerkInput}/>
                                </div>

                                <div className="ordenen">
                                    <label htmlFor="Plaats">Plaats:</label>
                                    <select id="Plaats" value={product.Plaats} onChange={verwerkInput}>
                                        <option value="">selecteer een plaats</option> 
                                        {mogelijkePlaatsen.map((plaats, index) => (
                                            <option key={index} value={plaats}>{plaats}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="ordenen">
                                    <label htmlFor="Minimumprijs" className="minimumPrice">Minimum prijs:</label>
                                    <input type="number" id="Minimumprijs" step="0.01" value={product.Minimumprijs} onChange={verwerkInput}/>
                                </div>
                            </div>
                        </section>

                        <section className="schermDeel3">
                            <div className="scherm3Container">
                                <div className="scherm3Ordenen">
                                    <label htmlFor="beginDatum" className="sDate">Begin datum:</label>
                                    <input type="date" id="beginDatum" value={product.beginDatum} onChange={verwerkInput} />
                                </div>

                                <button className="placeProduct" onClick={gegevensVersturen}>
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