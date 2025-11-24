import './css/HoofdSchermStyle.css';
import './css/registration.css';
import { Link } from 'react-router-dom';

export default function Registration() {
  return (
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
.

            <div className="grid-2">
              <div>
                <label className="visually-hidden" htmlFor="voornaam">Voornaam</label>
                <input id="voornaam" name="voornaam" type="text" placeholder="Voornaam" required autoComplete="given-name" />
              </div>
              <div>
                <label className="visually-hidden" htmlFor="achternaam">Achternaam</label>
                <input id="achternaam" name="achternaam" type="text" placeholder="Achternaam" required autoComplete="family-name" />
              </div>
            </div>

            <label className="visually-hidden" htmlFor="email">E-mailadres</label>
            <input id="email" name="email" type="email" placeholder="Emailadres" inputMode="email" required autoComplete="email" />

            <label className="visually-hidden" htmlFor="wachtwoord">Wachtwoord</label>
            <input id="wachtwoord" name="wachtwoord" type="password" placeholder="Wachtwoord" required autoComplete="new-password" />

            <div className="grid-2">
              <div>
                <label className="visually-hidden" htmlFor="straat">Straatnaam + huisnummer</label>
                <input id="straat" name="straat" type="text" placeholder="Straatnaam + huisnummer" required autoComplete="address-line1" />
              </div>
              <div>
                <label className="visually-hidden" htmlFor="postcode">Postcode</label>
                <input id="postcode" name="postcode" type="text" placeholder="Postcode" inputMode="text" pattern="[A-Za-z0-9 ]{4,8}" autoComplete="postal-code" />
              </div>
            </div>

            <div className="grid-2">
              <div>
                <label className="visually-hidden" htmlFor="bedrijf">Bedrijf</label>
                <input id="bedrijf" name="bedrijf" type="text" placeholder="Bedrijfsnaam" required />
              </div>
              <div>
                <label className="visually-hidden" htmlFor="kvk">KvK nr</label>
                <input id="kvk" name="kvk" type="text" placeholder="KvK nr" inputMode="numeric" pattern="[0-9 ]{6,12}" required />
              </div>
            </div>

            <label className="visually-hidden" htmlFor="btw">BTW nummer</label>
            <input id="btw" name="btw" type="text" placeholder="BTW nummer" pattern="[A-Za-z0-9]{8,20}" required />

            <div className="consent-row">
              <label className="checkbox">
                <input type="checkbox" name="terms" required />
                <span>Ik accepteer de algemene voorwaarden van uw site.</span>
              </label>
            </div>

            <button type="submit" className="btn-primary">Registreren</button>

            <p className="login-hint">
              Heb je al een account? <Link id="loginTekst" to="/login">Log hier in</Link>
            </p>
          </form>
        </div>

        <div className="hero-right" aria-hidden="true" />
      </div>
    </main>
  );
}
