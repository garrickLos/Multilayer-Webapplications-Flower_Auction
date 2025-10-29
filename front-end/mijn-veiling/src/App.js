import './App.css';
import './registration.css';
import './homePageStylesheet.css';
import './header_footer.css';
import Header from './Registration.js';

function App() {
  return (
    <>
      <Header />

      <main className="hero">
        <div className="container hero-grid">
          <div className="hero-left">
            <h1>Registreren</h1>

            <form className="form" action="#" method="post" noValidate>
              <label className="visually-hidden" htmlFor="rol">Klant of Kweker</label>
              <div className="select-wrap">
                <select id="rol" name="rol" required defaultValue="">
                  <option value="" disabled>Klant of Kweker</option>
                  <option value="klant">Klant</option>
                  <option value="kweker">Kweker</option>
                </select>
                <span className="chev" aria-hidden="true">▾</span>
              </div>

              <div className="grid-2">
                <div>
                  <label className="visually-hidden" htmlFor="voornaam">Voornaam</label>
                  <input id="voornaam" name="voornaam" type="text" placeholder="Voornaam" required />
                </div>
                <div>
                  <label className="visually-hidden" htmlFor="achternaam">Achternaam</label>
                  <input id="achternaam" name="achternaam" type="text" placeholder="Achternaam" required />
                </div>
              </div>

              <label className="visually-hidden" htmlFor="email">E-mailadres</label>
              <input id="email" name="email" type="email" placeholder="Emailadres" inputMode="email" required />

              <label className="visually-hidden" htmlFor="wachtwoord">Wachtwoord</label>
              <input id="wachtwoord" name="wachtwoord" type="password" placeholder="Wachtwoord" required />

              <div className="grid-2">
                <div>
                  <label className="visually-hidden" htmlFor="straat">Straatnaam + huisnummer</label>
                  <input id="straat" name="straat" type="text" placeholder="Straatnaam + huisnummer" />
                </div>
                <div>
                  <label className="visually-hidden" htmlFor="postcode">Postcode</label>
                  <input id="postcode" name="postcode" type="text" placeholder="Postcode" pattern="[A-Za-z0-9 ]{4,8}" />
                </div>
              </div>

              <p className="subtle-label">Alleen voor Kweker</p>
              <div className="grid-2">
                <div>
                  <label className="visually-hidden" htmlFor="bedrijf">Bedrijf</label>
                  <input id="bedrijf" name="bedrijf" type="text" placeholder="Bedrijf" />
                </div>
                <div>
                  <label className="visually-hidden" htmlFor="kvk">Kvk nr</label>
                  <input id="kvk" name="kvk" type="text" placeholder="Kvk nr" inputMode="numeric" pattern="[0-9 ]{6,12}" />
                </div>
              </div>

              <div className="consent-row">
                <label className="checkbox">
                  <input type="checkbox" name="terms" required />
                  <span>Ik accepteer de algemene voorwaarden van uw site.</span>
                </label>
              </div>

              <button type="submit" className="btn-primary">Registreren</button>

              <p className="login-hint">
                Have already an account? <a id="loginTekst" href="#">Login here</a>
              </p>
            </form>
          </div>

          <div className="hero-right" aria-hidden="true"></div>
        </div>
      </main>

      <footer>
        <div className="overlayBlock">
          <div className="footerText">
            <div className="footer-image">
              <img src="/resources/pictures/ico/Screenshot_2025-10-27_114430-removebg-preview.ico" alt="" />
            </div>
            <div className="text-column_one">
              <p>Intranet Royal FloraHolland</p>
            </div>
            <div className="text-column_two"></div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default App;
