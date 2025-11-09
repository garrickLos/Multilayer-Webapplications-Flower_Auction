import './css/MainScreenStyle.css';

import Header, {Footer} from './Header_footer';
import './css/SellerScreenAdd.css';


export default function SellerScreenAdd() {
    return (
        <main>
            <div className="BODY">
            <Header />
                <div className="banner-content">
                    <div className="registratie-knoppen">
                        <button type="button" className="knop-inloggen" aria-label="knop voor het inloggen">inloggen &#10095;</button>
                        <button type="button" className="knop-registreren" aria-label="knop voor registreren van een account">registreren &#10095;</button>
                    </div>
                </div>
            <div className="Mainschermen">
            <section>
                <h2>Artificial Citroen boom in deco pot</h2>
                <div className="ArtikelNummer">
                    <h2>Actn:</h2>
                    <h3>A3-36638-132</h3>
                </div>
            </section>

            <div className="Container">
            <section className="schermDeel1">
                <div className="fotoContainer">
                    <img src="../../webp/download.webp" alt="dababy" className="grote-foto"/>
                    <div className="kleine-fotos">
                        <img src="../../webp/download.webp" alt="dababy"
                             className="kleine-foto"/>
                        <img src="../../webp/download.webp" alt="dababy"
                             className="kleine-foto"/>
                        <img src="../../webp/download.webp" alt="dababy"
                             className="kleine-foto"/>
                    </div>
                </div>
            </section>

            <section className="schermDeel2">
                <div className="scherm2Container">
                    <div className="kopje">Product Details</div>
                    <div className="ordenen">
                        <label htmlFor="username" className="name">Product name:</label>
                        <input type="text" id="username" name="username"/>
                    </div>
                    <div className="ordenen">
                        <label htmlFor="productcategory" className="category">Product category:</label>
                        <input type="text" id="productcategory" name="productcategory"/>
                    </div>
                    <div className="ordenen">
                        <label htmlFor="productamount" className="amount">Amount:</label>
                        <input type="number" id="productamount" name="productamount"/>
                    </div>
                    <div className="ordenen">
                        <label htmlFor="productplace" className="place">Place:</label>
                        <input type="text" id="productplace" name="productplace"/>
                    </div>
                    <div className="ordenen">
                        <label htmlFor="minimumPriceProduct" className="minimumPrice">Minimum Price:</label>
                        <input type="number" id="minimumPriceProduct" name="minimumPriceProduct"/>
                    </div>
                </div>
            </section>

            <section className="schermDeel3">
                <div className="scherm3Container">
                    <div className="scherm3Ordenen">
                        <label htmlFor="startPrice" className="price">Start price:</label>
                        <input type="number" id="startPrice" name="startPrice"/>
                    </div>
                    <div className="scherm3Ordenen">
                        <label htmlFor="startDate" className="sDate">Start date:</label>
                        <input type="date" id="startDate" name="startDate"/>
                    </div>
                    <div className="scherm3Ordenen">
                        <label htmlFor="endDate" className="eDate">End date:</label>
                        <input type="date" id="endDate" name="endDate"/>
                    </div>
                    <button className="placeProduct">Place Product</button>
                </div>
            </section>
            </div>
            </div>
            <Footer/>
            </div>
        </main>
    )
}
