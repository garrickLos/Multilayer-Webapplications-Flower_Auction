import React, { useState, useEffect } from "react";
import "../css/SellerScreenAdd.css";
import { resolveApiUrl, resolveImageUrl } from "../config/api";
import MissingPicture from "../assets/pictures/webp/MissingPicture.webp";
import { getRefreshToken, getBearerToken, ApiRequest } from "../Componenten/index";

interface CategorieType {
    categorieNr: number;
    naam: string;
}

let token = getBearerToken() || "";
let refreshtoken = getRefreshToken() || "";

export default function SellerScreenAdd() {
    const [categorieLijst, setCategorieLijst] = useState<CategorieType[]>([]);

    /**Haalt categorien op via api en slaat die op */
        useEffect(() => {
        const dataOphalen = async () => {
        const response = await ApiRequest<CategorieType[]>(
          '/api/Categorie',
          "GET",
          null,
          token,
          refreshtoken
        );

        const categorieLijst = response as CategorieType[];
        setCategorieLijst(categorieLijst);
        };
    
        dataOphalen();
        }, [refreshtoken]);
    const mogelijkePlaatsen = ["Aalsmeer", "Rijnsburg", "Eelde", "Naaldwijk"];
    const Default_ImagePlaceholder = MissingPicture;

    const categorieAfbeeldingen = [
        { label: "Chrysant", value: "productBloemen/Chrysant.webp" },
        { label: "Dahlia", value: "productBloemen/DecoratieveDahliaSunsetFlare.webp" },
        { label: "Lelie", value: "productBloemen/Lelie.webp" },
        { label: "Pioenroos", value: "productBloemen/Pioenroos.webp" },
        { label: "Roos", value: "productBloemen/Roos.webp" },
        { label: "Tulp", value: "productBloemen/EleganteTulpCrimsonGlory.webp" }
    ];

    //vaste data die wordt meegegeven aan de endpoint
    const Data = {
        status: true,
        Kwekernr: sessionStorage.getItem("gebruikerNummer"),
        ImagePath: Default_ImagePlaceholder,
        VoorraadBloemen: 1000
    };

    //beginwaardes van productvelden
    const [product, setProduct] = useState({
        Naam: "",
        AantalFusten: "",
        CategorieNr: "",
        Plaats: "",
        Minimumprijs: "",
        BeginDatum: "",
        GeplaatstDatum: ""
    });

    //beginwaardes van validatiefouten
    const [errors, setErrors] = useState({
        Naam: "",
        AantalFusten: "",
        CategorieNr: "",
        Plaats: "",
        BeginDatum: "",
        Minimumprijs: ""
    });

    const [imagePath, setImagePath] = useState(Data.ImagePath);
    const resolvedImagePath =
        imagePath === Default_ImagePlaceholder
            ? Default_ImagePlaceholder
            : resolveImageUrl(imagePath);

    /**
     * controlleert op welke inputveld het is en controlleert of er een fout is opgetreden
     * @param id naam van het veld waar er een error is
     * @param value waarden wat er is ingevoerd
     * @returns geeft een passende foutmelding bij de fout en anders geeft het true terug als er niks fout is
     */
    const validateField = (id: string, value: string | number) => {
        let error = "";

        switch(id) {
            case "Naam":
                if (!value || (value as string).trim() === "") error = "Naam mag niet leeg zijn";
                break;
            case "AantalFusten":
                if (!value || Number(value) < 1) error = "Aantal fusten moeten groter dan 0 zijn";
                break;
            case "CategorieNr":
                if (!value || Number(value) < 1) error = "Selecteer een categorie";
                break;
            case "Plaats":
                if (!value) error = "Selecteer een plaats";
                break;
            case "BeginDatum":
                if (!value) error = "Datum mag niet leeg zijn";
                break;
                case "Minimumprijs":
                    if(!value || Number(value) < 0.01) error = "Minimumprijs moet minimaal 0,01 zijn";
        }

        setErrors(prev => ({ ...prev, [id]: error }));
        return error === "";
    };

    //update de product state bij een input wijziging
    const verwerkInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;

        setProduct(prev => ({
            ...prev,
            [id]: value
        }));

        //roept de functie validateField die de waarde controlleerd op foute input
        validateField(id, value);
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { value } = e.target;
        if (!value) {
            setImagePath(Default_ImagePlaceholder);
            return;
        }

        setImagePath(value);
    };
    

    const huidigeTijd = new Date().toISOString();
    
    /**
     * controlleert of je bent ingelogd, vervolgens valideert hij alle velden of er fouten zijn.
     * Daarna combineert hij 'vaste data' met de ingevoerde data en berekent hij de minimumprijs in hele ints.
     * Hij stuurt een post request naar de backend api om producten toe te voegen
     * @returns product toegevoegd als het geslaagd is en een foutmelding als er iets fout is gegaan
     */
    const GegevensVersturen = async () => {
        const token = sessionStorage.getItem("token");
        if (!token) {
            alert("Je bent niet ingelogd.");
            return;
        }
        const allValid = Object.keys(errors).every(key => validateField(key, (product as never)[key]));
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
            console.log(product.CategorieNr);
            const response = await fetch(resolveApiUrl("/api/Veilingproduct"), {
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
                                <img src={resolvedImagePath || Default_ImagePlaceholder} alt="productfoto" className="grote-foto" />
                            </div>
                            <div className="ordenen-bestand">
                                <label htmlFor="CategorieAfbeelding" className="bestand">Categorie afbeelding:</label>
                                <select
                                    id="CategorieAfbeelding"
                                    value={imagePath === Default_ImagePlaceholder ? "" : imagePath}
                                    onChange={handleImageSelect}
                                >
                                    <option value="">selecteer een categorie afbeelding</option>
                                    {categorieAfbeeldingen.map((image) => (
                                        <option key={image.value} value={image.value}>{image.label}</option>
                                    ))}
                                </select>
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
                                    <label htmlFor="Minimumprijs" className="minimumPrice">Minimum prijs in centen:</label>
                                    <input type="number" id="Minimumprijs" step="0.01" value={product.Minimumprijs} onChange={verwerkInput} placeholder="0,01-10000" min={0.01} />
                                    {errors.Minimumprijs && <span className="error">{errors.Minimumprijs}</span>}
                                </div>

                                <div className="ordenen">
                                    <label htmlFor="BeginDatum" className="sDate">Datum voor veiling:</label>
                                    <input type="date" id="BeginDatum" value={product.BeginDatum} onChange={verwerkInput} />
                                    {errors.BeginDatum && <span className="error">{errors.BeginDatum}</span>}
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