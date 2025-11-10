import './css/MainScreenStyle.css';
import './css/registration.css';
import { Link } from 'react-router-dom';

export default function Login() {
  return (
    <main className="hero">
      <div className="container hero-grid">
        <div className="hero-left">
          <h1>Inloggen</h1>

          <form className="form" action="#" method="post" noValidate>
            <label className="visually-hidden" htmlFor="email">E-mailadres</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Emailadres"
              inputMode="email"
              required
              autoComplete="username"
            />

            <label className="visually-hidden" htmlFor="wachtwoord">Wachtwoord</label>
            <input
              id="wachtwoord"
              name="wachtwoord"
              type="password"
              placeholder="Wachtwoord"
              required
              autoComplete="current-password"
            />

            <div className="consent-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="checkbox">
                <input type="checkbox" name="remember" />
                <span>Onthoud mij</span>
              </label>

              <a href="#" className="subtle-label" id="forgotLink">Wachtwoord vergeten?</a>
            </div>

            <button type="submit" className="btn-primary">Inloggen</button>

            <p className="login-hint">
              Nog geen account? <Link id="loginTekst" to="/registration">Registreer hier</Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
