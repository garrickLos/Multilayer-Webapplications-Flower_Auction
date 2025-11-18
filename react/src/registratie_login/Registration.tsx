import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/MainScreenStyle.css';
import './css/Registration.css';

// Toegestane rollen
type Role = 'klant' | 'kweker';

// Data die we naar de backend sturen
type RegistrationPayload = {
    role: Role;
    firstName: string;
    lastName: string;
    email: string;
    password: string;   // gehashte variant
    street: string;
    postalCode: string;
    company: string;
    kvk: string;
    vatNumber: string;
};

// Fouten per veld
type FieldErrors = {
    rol?: string;
    voornaam?: string;
    achternaam?: string;
    email?: string;
    wachtwoord?: string;
    straat?: string;
    postcode?: string;
    bedrijf?: string;
    kvk?: string;
    btw?: string;
    terms?: string;
};

// Simpel input-component met label + foutmelding
type TextFieldProps = {
    id: string;
    name: keyof FieldErrors | string;
    label: string;
    type?: string;
    placeholder?: string;
    autoComplete?: string;
    inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
    pattern?: string;
    error?: string;
};

function TextField({id, name, label, type = 'text', placeholder, autoComplete, inputMode, pattern, error}: TextFieldProps) {
    const hasError = !!error;
    return (
        <div className={`field-group ${hasError ? 'field-group-error' : ''}`}>
            <label className="field-label" htmlFor={id}>
                {label}
            </label>
            <input
                id={id}
                name={name}
                type={type}
                placeholder={placeholder}
                autoComplete={autoComplete}
                inputMode={inputMode}
                pattern={pattern}
                required
            />
            {hasError && <p className="field-error">{error}</p>}
        </div>
    );
}

// Hash wachtwoord
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function Registration() {
    const navigate = useNavigate();
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Formulier versturen: eerst checken, dan payload bouwen
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setGlobalError(null);
        setFieldErrors({});

        const form = event.currentTarget;
        const data = new FormData(form);
        const value = (name: string) => String(data.get(name) ?? '').trim();

        const errors: FieldErrors = {};

        // Algemene voorwaarden
        if (!data.get('terms')) {
            errors.terms = 'Je moet de algemene voorwaarden accepteren.';
        }

        // Rol
        const rawRole = value('rol');
        if (rawRole !== 'klant' && rawRole !== 'kweker') {
            errors.rol = 'Selecteer een rol: Klant of Kweker.';
        }

        // Naam
        const firstName = value('voornaam');
        if (!firstName) errors.voornaam = 'Voornaam is verplicht.';

        const lastName = value('achternaam');
        if (!lastName) errors.achternaam = 'Achternaam is verplicht.';

        // E-mail: heel simpele check
        const email = value('email');
        if (!email) {
            errors.email = 'E-mailadres is verplicht.';
        } else if (!email.includes('@') || !email.includes('.')) {
            errors.email = 'Vul een geldig e-mailadres in.';
        }

        // Wachtwoord: min. 8 tekens
        const rawPassword = value('wachtwoord');
        if (!rawPassword) {
            errors.wachtwoord = 'Wachtwoord is verplicht.';
        } else if (rawPassword.length < 8) {
            errors.wachtwoord = 'Wachtwoord moet minimaal 8 tekens zijn.';
        }

        // Adres
        const street = value('straat');
        if (!street) errors.straat = 'Straat en huisnummer zijn verplicht.';

        const postalCode = value('postcode');
        if (!postalCode) errors.postcode = 'Postcode is verplicht.';

        // Bedrijf
        const company = value('bedrijf');
        if (!company) errors.bedrijf = 'Bedrijfsnaam is verplicht.';

        // KvK: alleen cijfers, 6–12 lang
        const kvkRaw = value('kvk');
        const kvkDigits = kvkRaw.replace(/\D/g, ''); // alleen nummers
        if (!kvkDigits) {
            errors.kvk = 'KvK nummer is verplicht.';
        } else if (kvkDigits.length < 6 || kvkDigits.length > 12) {
            errors.kvk = 'KvK moet uit 6–12 cijfers bestaan.';
        }

        // BTW: gewoon niet leeg, uppercase
        const vatNumberRaw = value('btw').replace(/\s+/g, '').toUpperCase();
        if (!vatNumberRaw) {
            errors.btw = 'BTW nummer is verplicht.';
        }

        // Stop als er fouten zijn
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setSubmitting(true);

        try {
            // Wachtwoord eerst hashen met SHA-256
            const hashedPassword = await hashPassword(rawPassword);

            const payload: RegistrationPayload = {role: rawRole as Role, firstName, lastName, email, password: hashedPassword, street, postalCode, company, kvk: kvkDigits, vatNumber: vatNumberRaw,};

            console.log('Registratiepayload klaar voor API/AuthContext:', payload);

            // Later:
            // await fetch('/api/auth/register', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify(payload),
            // });

            navigate('/inloggen');
        } catch (e) {
            console.error(e);
            setGlobalError('Er ging iets mis bij het registreren.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="hero">
            <div className="container hero-grid">
                <div className="hero-left">
                    <h1>Registreren</h1>

                    <form className="form" onSubmit={handleSubmit} noValidate>
                        {/* Rol */}
                        <div className={`field-group ${fieldErrors.rol ? 'field-group-error' : ''}`}>
                            <label className="field-label" htmlFor="rol">
                                Rol
                            </label>
                            <div className="select-wrap">
                                <select id="rol" name="rol" required defaultValue="">
                                    <option value="" disabled>
                                        Kies een rol
                                    </option>
                                    <option value="klant">Klant</option>
                                    <option value="kweker">Kweker</option>
                                </select>
                                <span className="chev" aria-hidden="true">▾</span>
                            </div>
                            {fieldErrors.rol && <p className="field-error">{fieldErrors.rol}</p>}
                        </div>

                        {/* Naam */}
                        <div className="grid-2">
                            <TextField
                                id="voornaam"
                                name="voornaam"
                                label="Voornaam"
                                placeholder="Voornaam"
                                autoComplete="given-name"
                                error={fieldErrors.voornaam}
                            />
                            <TextField
                                id="achternaam"
                                name="achternaam"
                                label="Achternaam"
                                placeholder="Achternaam"
                                autoComplete="family-name"
                                error={fieldErrors.achternaam}
                            />
                        </div>

                        {/* Email */}
                        <TextField
                            id="email"
                            name="email"
                            label="E-mailadres"
                            type="email"
                            placeholder="Emailadres"
                            autoComplete="email"
                            inputMode="email"
                            error={fieldErrors.email}
                        />

                        {/* Wachtwoord */}
                        <TextField
                            id="wachtwoord"
                            name="wachtwoord"
                            label="Wachtwoord"
                            type="password"
                            placeholder="Wachtwoord"
                            autoComplete="new-password"
                            error={fieldErrors.wachtwoord}
                        />

                        {/* Adres */}
                        <div className="grid-2">
                            <TextField
                                id="straat"
                                name="straat"
                                label="Straat + huisnummer"
                                placeholder="Straatnaam + huisnummer"
                                autoComplete="address-line1"
                                error={fieldErrors.straat}
                            />
                            <TextField
                                id="postcode"
                                name="postcode"
                                label="Postcode"
                                placeholder="Postcode"
                                autoComplete="postal-code"
                                inputMode="text"
                                pattern="[A-Za-z0-9 ]{4,8}"
                                error={fieldErrors.postcode}
                            />
                        </div>

                        {/* Bedrijf + KvK */}
                        <div className="grid-2">
                            <TextField
                                id="bedrijf"
                                name="bedrijf"
                                label="Bedrijfsnaam"
                                placeholder="Bedrijfsnaam"
                                error={fieldErrors.bedrijf}
                            />
                            <TextField
                                id="kvk"
                                name="kvk"
                                label="KvK nummer"
                                placeholder="KvK nummer"
                                inputMode="numeric"
                                pattern="[0-9]{6,12}"
                                error={fieldErrors.kvk}
                            />
                        </div>

                        {/* BTW */}
                        <TextField
                            id="btw"
                            name="btw"
                            label="BTW nummer"
                            placeholder="BTW nummer"
                            pattern="[A-Za-z0-9]{8,20}"
                            error={fieldErrors.btw}
                        />

                        {/* Algemene voorwaarden */}
                        <div className={`field-group ${fieldErrors.terms ? 'field-group-error' : ''}`}>
                            <div className="consent-row">
                                <label className="checkbox">
                                    <input type="checkbox" name="terms" required />
                                    <span>Ik accepteer de algemene voorwaarden van uw site.</span>
                                </label>
                            </div>
                            {fieldErrors.terms && (
                                <p className="field-error">{fieldErrors.terms}</p>
                            )}
                        </div>

                        {/* Globale fout (bijv. server error) */}
                        {globalError && (
                            <p className="form-error" aria-live="polite">
                                {globalError}
                            </p>
                        )}

                        <button type="submit" className="btn-primary" disabled={submitting}>
                            {submitting ? 'Bezig met registreren...' : 'Registreren'}
                        </button>

                        <p className="login-hint">
                            Heb je al een account?{' '}
                            <Link id="loginTekst" to="/inloggen">
                                Log hier in
                            </Link>
                        </p>
                    </form>
                </div>

                <div className="hero-right" aria-hidden="true" />
            </div>
        </main>
    );
}
