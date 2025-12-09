import React, { useState } from "react";
import "../css/SellerScreenAdd.css";
import { UseDataApi as GetCategorie } from "../typeScript/ApiGet";
import {TokenOphalen} from "./Header_footer.tsx";

interface CategorieType {
    categorieNr: number;
    naam: string;
}

export default function SellerScreenAdd() {
    const token = TokenOphalen.getToken();
    const mogelijkePlaatsen = ["Aalsmeer", "Rijnsburg", "Eelde", "Naaldwijk"];
    const bestandsPad = "../../src/assets/pictures/productBloemen/";
    const Default_ImagePlaceholder = '/src/assets/pictures/webp/MissingPicture.webp';
    const { data } = GetCategorie('/api/Categorie');
    const categorieLijst = (data as CategorieType[]) || [];

    const Data = {
        status: true,
        Kwekernr: 3,
        ImagePath: ""
    };

    const [product, setProduct] = useState({
        Naam: "",
        AantalFusten: "",
        VoorraadBloemen: "",
        CategorieNr: "",
        Plaats: "",
        Minimumprijs: "",
        beginDatum: "",
        GeplaatstDatum: ""
    });

    const [errors, setErrors] = useState({
        Naam: "",
        AantalFusten: "",
        VoorraadBloemen: "",
        CategorieNr: "",
        Plaats: "",
        beginDatum: "",
        Minimumprijs: ""
    });

    const [imagePath, setImagePath] = useState(Data.ImagePath);

    const validateField = (id: string, value: string | number) => {
        let error = "";

        switch(id) {
            case "Naam":
                if (!value || (value as string).trim() === "") error = "Productnaam mag niet leeg zijn";
                break;
            case "AantalFusten":
            case "VoorraadBloemen":
                if (!value || Number(value) < 1) error = "Getal moet groter dan 0 zijn";
                break;
            case "CategorieNr":
                if (!value || Number(value) < 1) error = "Selecteer een categorie";
                break;
            case "Plaats":
                if (!value) error = "Selecteer een plaats";
                break;
            case "beginDatum":
                if (!value) error = "Datum mag niet leeg zijn";
                break;
                case "Minimumprijs":
                    if(!value || Number(value) < 0.01) error = "Getal moet minimaal 0,01 zijn";
        }

        setErrors(prev => ({ ...prev, [id]: error }));
        return error === "";
    };

    const verwerkInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;

        setProduct(prev => ({
            ...prev,
            [id]: value
        }));

        validateField(id, value);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith(".webp")) {
            alert("Het bestand moet eindigen op '.webp'");
            return;
        }

        const volledigeBestand = bestandsPad + file.name;
        setImagePath(volledigeBestand);
    };
    
    const huidigeTijd = new Date().toISOString();
    
    const GegevensVersturen = async () => {
        const allValid = Object.keys(errors).every(key => validateField(key, (product as any)[key]));
        if (!allValid) {
            alert("Controleer de velden in rood!");
            return;
        }
        const AlleGegevens = {
            ...Data,
            ...product,
            Minimumprijs: Math.round(Number(product.Minimumprijs) * 100),
            ImagePath: imagePath,
            GeplaatstDatum: huidigeTijd
        };

        try {
            console.log(AlleGegevens.GeplaatstDatum);
            console.log(AlleGegevens);
            console.log(token)
            const response = await fetch("/api/Veilingproduct", {
                method: "POST",
                headers: { "Content-Type": "application/json",
                "Authorization": "Bearer " + token},
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
                    <div className="Container">
                        <section className="schermDeel1">
                            <div className="fotoContainer">
                                <img src={imagePath || Default_ImagePlaceholder} alt="productfoto" className="grote-foto" />
                            </div>
                            <div className="ordenen">
                                <label htmlFor="BestandPad" className="bestand"></label>
                                <input type="file" id="BestandPad" accept=".webp" onChange={handleFileChange} />
                            </div>
                        </section>

                        <section className="schermDeel2">
                            <div className="scherm2Container">
                                <div className="kopje">Product informatie</div>

                                <div className="ordenen">
                                    <label htmlFor="Naam" className="name">Product naam:</label>
                                    <input type="text" id="Naam" value={product.Naam} onChange={verwerkInput} placeholder="Product naam" />
                                    {errors.Naam && <span className="error">{errors.Naam}</span>}
                                </div>

                                <div className="ordenen">
                                    <label htmlFor="CategorieNr">Categorie:</label>
                                    <select id="CategorieNr" value={product.CategorieNr} onChange={verwerkInput}>
                                        <option value="">selecteer een categorie</option>
                                        {categorieLijst.map(c => (
                                            <option key={c.categorieNr} value={c.categorieNr}>{c.naam}</option>
                                        ))}
                                    </select>
                                    {errors.CategorieNr && <span className="error">{errors.CategorieNr}</span>}
                                </div>

                                <div className="ordenen">
                                    <label htmlFor="VoorraadBloemen" className="amount">Voorraad:</label>
                                    <input type="number" id="VoorraadBloemen" value={product.VoorraadBloemen} onChange={verwerkInput} min={1} placeholder="1-10000" />
                                    {errors.VoorraadBloemen && <span className="error">{errors.VoorraadBloemen}</span>}
                                </div>

                                <div className="ordenen">
                                    <label htmlFor="AantalFusten" className="fusten">Aantal fusten:</label>
                                    <input type="number" id="AantalFusten" min="1" value={product.AantalFusten} onChange={verwerkInput} placeholder="1-10000" />
                                    {errors.AantalFusten && <span className="error">{errors.AantalFusten}</span>}
                                </div>

                                <div className="ordenen">
                                    <label htmlFor="Plaats">Plaats:</label>
                                    <select id="Plaats" value={product.Plaats} onChange={verwerkInput}>
                                        <option value="">selecteer een plaats</option>
                                        {mogelijkePlaatsen.map((plaats, index) => (
                                            <option key={index} value={plaats}>{plaats}</option>
                                        ))}
                                    </select>
                                    {errors.Plaats && <span className="error">{errors.Plaats}</span>}
                                </div>

                                <div className="ordenen">
                                    <label htmlFor="Minimumprijs" className="minimumPrice">Minimum prijs:</label>
                                    <input type="number" id="Minimumprijs" step="0.01" value={product.Minimumprijs} onChange={verwerkInput} placeholder="0,01-10000" min={0.01} />
                                    {errors.Minimumprijs && <span className="error">{errors.Minimumprijs}</span>}
                                </div>
                            </div>
                        </section>

                        <section className="schermDeel3">
                            <div className="scherm3Container">
                                <div className="ordenen">
                                    <label htmlFor="beginDatum" className="sDate">Datum:</label>
                                    <input type="date" id="beginDatum" value={product.beginDatum} onChange={verwerkInput} />
                                    {errors.beginDatum && <span className="error">{errors.beginDatum}</span>}
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
