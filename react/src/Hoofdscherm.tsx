import './css/MainScreenStyle.css';

import Header, {Footer} from './Header_footer';
import { scrollSlider } from './typeScript/sliderCommand.tsx';

export default function(){
    return (

        <body>
            <main>

            <Header />

            <div className="banner">
                <div className="banner-content">
                    <h1>Royal Flora Holland - Veiling</h1>
                    <h2>Verkoop wereldwijd met Royal FloraHolland</h2>
                    <div className="registratie-knoppen">
                        <button type="button" className="knop-inloggen" aria-label="knop voor het inloggen">inloggen &#10095;</button>
                        <button type="button" className="knop-registreren" aria-label="knop voor registreren van een account">registreren &#10095;</button>
                    </div>
                </div>
            </div>

            <section>
                <h2>Laatste kans!</h2>
                <div className="slider-container">
                    <button className="arrow" onClick={() => scrollSlider('lastChance', -3)}>&#10094;</button>
                    <div className="slider" id="lastChance">
                        <div className="card"><img></img><h3>Artificial Citroen boom in deco pot</h3><p>Lorem ipsum dolor sit amet.</p></div>
                        <div className="card"><img></img><h3>Artificial Citroen boom in deco pot</h3><p>Lorem ipsum dolor sit amet.</p></div>
                        <div className="card"><img></img><h3>Artificial Citroen boom in deco pot</h3><p>Lorem ipsum dolor sit amet.</p></div>
                        <div className="card"><img></img><h3>Artificial Citroen boom in deco pot</h3><p>Lorem ipsum dolor sit amet.</p></div>
                        <div className="card"><img></img><h3>Artificial Citroen boom in deco pot</h3><p>Lorem ipsum dolor sit amet.</p></div>
                        <div className="card"><img></img><h3>Artificial Citroen boom in deco pot</h3><p>Lorem ipsum dolor sit amet.</p></div>
                        <div className="card"><img></img><h3>Artificial Citroen boom in deco pot</h3><p>Lorem ipsum dolor sit amet.</p></div>
                        <div className="card"><img></img><h3>Artificial Citroen boom in deco pot</h3><p>Lorem ipsum dolor sit amet.</p></div>
                    </div>
                    <button className="arrow" onClick={() => scrollSlider('lastChance', 3)}>&#10095;</button>
                </div>
            </section>

            <section>
                <h2>Aankomende veilingen!</h2>
                <div className="slider-container">
                    <button className="arrow" onClick={() => scrollSlider('upcoming', -3)}>&#10094;</button>
                    <div className="slider" id="upcoming">
                        <div className="card"><img></img><h3>Artificial Citroen boom in deco pot</h3><p>Lorem ipsum dolor sit amet.</p></div>
                        <div className="card"><img></img><h3>Artificial Citroen boom in deco pot</h3><p>Lorem ipsum dolor sit amet.</p></div>
                        <div className="card"><img></img><h3>Artificial Citroen boom in deco pot</h3><p>Lorem ipsum dolor sit amet.</p></div>
                        <div className="card"><img></img><h3>Artificial Citroen boom in deco pot</h3><p>Lorem ipsum dolor sit amet.</p></div>
                        <div className="card"><img></img><h3>Artificial Citroen boom in deco pot</h3><p>Lorem ipsum dolor sit amet.</p></div>
                        <div className="card"><img></img><h3>Artificial Citroen boom in deco pot</h3><p>Lorem ipsum dolor sit amet.</p></div>
                        <div className="card"><img></img><h3>Artificial Citroen boom in deco pot</h3><p>Lorem ipsum dolor sit amet.</p></div>
                        <div className="card"><img></img><h3>Artificial Citroen boom in deco pot</h3><p>Lorem ipsum dolor sit amet.</p></div>
                    </div>
                    <button className="arrow" onClick={() => scrollSlider('upcoming', 3)}>&#10095;</button>
                </div>
            </section>

            <section>
                <h2>All deals</h2>
                <div className="slider-container alle_deals ">
                    <button className="arrow" onClick={() => scrollSlider('alleDeals', -3)}>&#10094;</button>
                    <div className="slider" id="alleDeals">
                        <div className="deal-item"><button>Button</button></div>
                        <div className="deal-item"><button>Button</button></div>
                        <div className="deal-item"><button>Button</button></div>
                        <div className="deal-item"><button>Button</button></div>
                        <div className="deal-item"><button>Button</button></div>
                        <div className="deal-item"><button>Button</button></div>
                        <div className="deal-item"><button>Button</button></div>
                        <div className="deal-item"><button>Button</button></div>
                    </div>
                    <button className="arrow" onClick={() => scrollSlider('alleDeals', 3)}>&#10095;</button>
                </div>
            </section>

            <Footer />
        </main>

    </body>
    )
}


