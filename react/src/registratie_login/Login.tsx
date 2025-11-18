import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/MainScreenStyle.css';
import './css/Registration.css';

type LoginPayload = {
  email: string;
  password: string;   // gehashte variant
  rememberMe: boolean;
};

type FieldErrors = {
  email?: string;
  wachtwoord?: string;
  global?: string;
};

// Hash wachtwoord met SHA-256
async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
}

export default function Login() {
  const navigate = useNavigate();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

    const form = event.currentTarget;
    const data = new FormData(form);
    const value = (name: string) => String(data.get(name) ?? '').trim();

    const email = value('email');
    const rawPassword = value('wachtwoord');
    const rememberCheckbox = form.querySelector<HTMLInputElement>('input[name="remember"]');
    const rememberMe = !!rememberCheckbox?.checked;

    const newErrors: FieldErrors = {};

    if (!email) {
      newErrors.email = 'E-mailadres is verplicht.';
    } else if (!email.includes('@') || !email.includes('.')) {
      newErrors.email = 'Vul een geldig e-mailadres in.';
    }

    if (!rawPassword) {
      newErrors.wachtwoord = 'Wachtwoord is verplicht.';
    } else if (rawPassword.length < 8) {
      newErrors.wachtwoord = 'Wachtwoord moet minimaal 8 tekens zijn.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);

    try {
      const hashedPassword = await hashPassword(rawPassword);

      const payload: LoginPayload = {
        email,
        password: hashedPassword,
        rememberMe,
      };

      console.log('Login payload klaar voor API/AuthContext:', payload);

      // TODO: echte login-call
      // await fetch('/api/auth/login', {...});

      navigate('/');
    } catch (err) {
      console.error(err);
      setErrors({ global: 'Inloggen is niet gelukt. Probeer het later opnieuw.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
      <main className="hero">
        <div className="container hero-grid">
          <div className="hero-left">
            <h1>Inloggen</h1>

            <form className="form" onSubmit={handleSubmit} noValidate>
              {/* E-mailadres */}
              <div className={`field-group ${errors.email ? 'field-group-error' : ''}`}>
                <label className="field-label" htmlFor="email">
                  E-mailadres
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Emailadres"
                    inputMode="email"
                    autoComplete="username"
                    required
                />
                {errors.email && <p className="field-error">{errors.email}</p>}
              </div>

              {/* Wachtwoord */}
              <div className={`field-group ${errors.wachtwoord ? 'field-group-error' : ''}`}>
                <label className="field-label" htmlFor="wachtwoord">
                  Wachtwoord
                </label>
                <input
                    id="wachtwoord"
                    name="wachtwoord"
                    type="password"
                    placeholder="Wachtwoord"
                    autoComplete="current-password"
                    required
                />
                {errors.wachtwoord && (
                    <p className="field-error">{errors.wachtwoord}</p>
                )}
              </div>

              {/* Onthoud mij + Wachtwoord vergeten */}
              <div className="consent-row consent-row-inline">
                <label className="checkbox">
                  <input type="checkbox" name="remember" />
                  <span>Onthoud mij</span>
                </label>

                {/* TODO: later naar echte pagina /wachtwoord-vergeten */}
                <button
                    type="button"
                    className="forgot-link"
                    id="forgotLink"
                    onClick={() => alert('Wachtwoord reset functionaliteit wordt later toegevoegd.')}
                >
                  Wachtwoord vergeten?
                </button>
              </div>

              {/* Globale login-fout */}
              {errors.global && (
                  <p className="form-error" aria-live="polite">
                    {errors.global}
                  </p>
              )}

              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Bezig met inloggen...' : 'Inloggen'}
              </button>

              <p className="login-hint">
                Nog geen account?{' '}
                <Link id="loginTekst" to="/registreren">
                  Registreer hier
                </Link>
              </p>
            </form>
          </div>
        </div>
      </main>
  );
}
