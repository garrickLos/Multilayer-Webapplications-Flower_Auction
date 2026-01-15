import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resolveApiUrl } from '../config/api';
import './css/Registration.css';

/**
 * Request body voor /auth/register.
 */
interface RegisterRequest {
    email: string;
    password: string;
    confirmPassword: string;
    bedrijfsNaam: string;
    soort: string;
    kvk?: string;
    straatAdres?: string;
    postcode?: string;
}

/**
 * Response van /auth/register.
 */
interface RegisterResponse {
    success: boolean;
    errors: string[];
}

/**
 * Local state voor errors per veld + algemene foutmelding.
 */
type FormErrors = Partial<Record<keyof RegisterRequest, string>> & { general?: string };

/**
 * Startwaarden van het registratieformulier.
 */
const initialForm: RegisterRequest = {
    email: '',
    password: '',
    confirmPassword: '',
    bedrijfsNaam: '',
    soort: '',
    kvk: '',
    straatAdres: '',
    postcode: ''
};

/**
 * Pad waarnaar je navigeert na succesvolle registratie.
 */
const LOGIN_PATH = '/inloggen';

/**
 * Helper: class voor field-group, met error styling als er een fout is.
 */
const fieldGroupClass = (err?: string) =>
    `field-group${err ? ' field-group-error' : ''}`;

/**
 * Helper: class voor inputs, met invalid styling als er een fout is.
 */
const inputClass = (err?: string) =>
    `form-control${err ? ' is-invalid' : ''}`;

/**
 * Registratie pagina/component.
 * Valideert invoer, doet POST naar /auth/register en stuurt de gebruiker door naar inloggen.
 */
export default function Registration() {
    const [form, setForm] = useState<RegisterRequest>(initialForm);
    const [errors, setErrors] = useState<FormErrors>({});
    const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    /**
     * Update form state bij input changes.
     * - KvK: alleen cijfers, max 8
     * - Postcode: spaties eruit, uppercase, max 6
     * Reset veld-error en succesmelding bij wijziging.
     */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let newValue = value;

        if (name === 'kvk') {
            newValue = value.replace(/\D/g, '').slice(0, 8);
        } else if (name === 'postcode') {
            newValue = value.replace(/\s/g, '').toUpperCase().slice(0, 6);
        }

        setForm((prev) => ({ ...prev, [name]: newValue }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
        setSubmittedMessage(null);
    };

    /**
     * Frontend validatie om simpele fouten direct te tonen.
     * Controleert o.a. email, wachtwoord, confirmPassword, bedrijfsnaam, soort, KvK en postcode.
     */
    const validate = (): FormErrors => {
        const errs: FormErrors = {};
        const email = form.email.trim();
        const bedrijfsNaam = form.bedrijfsNaam.trim();
        const kvk = form.kvk?.trim();
        const postcode = form.postcode?.trim().toUpperCase();

        if (!email) {
            errs.email = 'E-mailadres is verplicht.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errs.email = 'E-mailadres is ongeldig.';
        }

        if (!form.password) {
            errs.password = 'Wachtwoord is verplicht.';
        } else if (form.password.length < 6) {
            errs.password = 'Wachtwoord moet minimaal 6 tekens bevatten.';
        }

        if (!form.confirmPassword) {
            errs.confirmPassword = 'Bevestig je wachtwoord.';
        } else if (form.confirmPassword !== form.password) {
            errs.confirmPassword = 'Wachtwoorden komen niet overeen.';
        }

        if (!bedrijfsNaam) {
            errs.bedrijfsNaam = 'Bedrijfsnaam is verplicht.';
        }

        if (!form.soort) {
            errs.soort = 'Selecteer een soort (bijv. Bedrijf of Koper).';
        }

        // Optioneel veld: alleen valideren als er iets ingevuld is
        if (kvk && !/^\d{8}$/.test(kvk)) {
            errs.kvk = 'KvK-nummer moet uit 8 cijfers bestaan.';
        }

        // Optioneel veld: alleen valideren als er iets ingevuld is
        if (postcode && !/^[1-9][0-9]{3}[A-Z]{2}$/.test(postcode)) {
            errs.postcode = 'Postcode moet het formaat 1234AB hebben.';
        }

        return errs;
    };

    /**
     * Submit handler:
     * - Valideert velden
     * - Stuurt POST request naar backend
     * - Toont backend fouten of algemene error
     * - Toont succesmelding en navigeert door naar login
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittedMessage(null);
        setErrors({});

        const validationErrors = validate();
        if (Object.values(validationErrors).some(Boolean)) {
            setErrors(validationErrors);
            return;
        }

        // Payload opschonen: trimmen en lege optionele velden als undefined sturen
        const payloadToSend: RegisterRequest = {
            ...form,
            email: form.email.trim(),
            bedrijfsNaam: form.bedrijfsNaam.trim(),
            kvk: form.kvk?.trim() || undefined,
            straatAdres: form.straatAdres?.trim() || undefined,
            postcode: form.postcode?.trim().toUpperCase() || undefined
        };

        setIsSubmitting(true);
        try {
            const response = await fetch(resolveApiUrl('/auth/register'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadToSend)
            });

            const payload = (await response.json().catch(() => null)) as RegisterResponse | null;

            if (!response.ok || !payload || !payload.success) {
                setErrors({
                    general:
                        payload?.errors?.length
                            ? payload.errors.join('\n')
                            : 'Er ging iets mis bij het versturen van het formulier.'
                });
                return;
            }

            setSubmittedMessage('Registratie succesvol! Je wordt doorgestuurd naar de loginpagina...');
            setForm(initialForm);

            // Kleine delay voor UX, daarna naar login
            setTimeout(() => navigate(LOGIN_PATH), 2000);
        } catch {
            setErrors({ general: 'Er ging iets mis bij het versturen van het formulier.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="hero">
            <div className="container hero-grid">
                <div className="hero-left">
                    <h1>Registreren</h1>

                    <form className="form" onSubmit={handleSubmit} noValidate>
                        <div className={fieldGroupClass(errors.email)}>
                            <label className="field-label" htmlFor="email">
                                E-mailadres
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className={inputClass(errors.email)}
                                value={form.email}
                                onChange={handleChange}
                                required
                                autoComplete="email"
                                placeholder="naam@bedrijf.nl"
                                aria-invalid={!!errors.email}
                                aria-describedby={errors.email ? 'email-error' : undefined}
                            />
                            {errors.email && (
                                <p id="email-error" className="field-error">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div className="grid-2">
                            <div className={fieldGroupClass(errors.password)}>
                                <label className="field-label" htmlFor="password">
                                    Wachtwoord
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    className={inputClass(errors.password)}
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
                                    placeholder="Minimaal 6 tekens"
                                    aria-invalid={!!errors.password}
                                    aria-describedby={errors.password ? 'password-error' : undefined}
                                />
                                {errors.password && (
                                    <p id="password-error" className="field-error">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <div className={fieldGroupClass(errors.confirmPassword)}>
                                <label className="field-label" htmlFor="confirmPassword">
                                    Bevestig wachtwoord
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    className={inputClass(errors.confirmPassword)}
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
                                    placeholder="Herhaal je wachtwoord"
                                    aria-invalid={!!errors.confirmPassword}
                                    aria-describedby={
                                        errors.confirmPassword ? 'confirmPassword-error' : undefined
                                    }
                                />
                                {errors.confirmPassword && (
                                    <p id="confirmPassword-error" className="field-error">
                                        {errors.confirmPassword}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid-2">
                            <div className={fieldGroupClass(errors.bedrijfsNaam)}>
                                <label className="field-label" htmlFor="bedrijfsNaam">
                                    Bedrijfsnaam
                                </label>
                                <input
                                    id="bedrijfsNaam"
                                    name="bedrijfsNaam"
                                    type="text"
                                    className={inputClass(errors.bedrijfsNaam)}
                                    value={form.bedrijfsNaam}
                                    onChange={handleChange}
                                    required
                                    placeholder="Bijv. Flora BV"
                                    aria-invalid={!!errors.bedrijfsNaam}
                                    aria-describedby={
                                        errors.bedrijfsNaam ? 'bedrijfsNaam-error' : undefined
                                    }
                                />
                                {errors.bedrijfsNaam && (
                                    <p id="bedrijfsNaam-error" className="field-error">
                                        {errors.bedrijfsNaam}
                                    </p>
                                )}
                            </div>

                            <div className={fieldGroupClass(errors.soort)}>
                                <label className="field-label" htmlFor="soort">
                                    Soort
                                </label>
                                <select
                                    id="soort"
                                    name="soort"
                                    className={inputClass(errors.soort)}
                                    value={form.soort}
                                    onChange={handleChange}
                                    required
                                    aria-invalid={!!errors.soort}
                                    aria-describedby={errors.soort ? 'soort-error' : undefined}
                                >
                                    <option value="" disabled>
                                        Kies een soort
                                    </option>
                                    <option value="Bedrijf">Bedrijf</option>
                                    <option value="Koper">Koper</option>
                                </select>
                                {errors.soort && (
                                    <p id="soort-error" className="field-error">
                                        {errors.soort}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid-2">
                            <div className={fieldGroupClass(errors.kvk)}>
                                <label className="field-label" htmlFor="kvk">
                                    KvK
                                </label>
                                <input
                                    id="kvk"
                                    name="kvk"
                                    type="text"
                                    className={inputClass(errors.kvk)}
                                    value={form.kvk ?? ''}
                                    onChange={handleChange}
                                    placeholder="8 cijfers"
                                    inputMode="numeric"
                                    maxLength={8}
                                    aria-invalid={!!errors.kvk}
                                    aria-describedby={errors.kvk ? 'kvk-error' : undefined}
                                />
                                {errors.kvk && (
                                    <p id="kvk-error" className="field-error">
                                        {errors.kvk}
                                    </p>
                                )}
                            </div>

                            <div className={fieldGroupClass()}>
                                <label className="field-label" htmlFor="straatAdres">
                                    Straat + huisnummer (optioneel)
                                </label>
                                <input
                                    id="straatAdres"
                                    name="straatAdres"
                                    type="text"
                                    className="form-control"
                                    value={form.straatAdres ?? ''}
                                    onChange={handleChange}
                                    autoComplete="address-line1"
                                    placeholder="Bijv. Bloemstraat 10"
                                />
                            </div>
                        </div>

                        <div className={fieldGroupClass(errors.postcode)}>
                            <label className="field-label" htmlFor="postcode">
                                Postcode (optioneel)
                            </label>
                            <input
                                id="postcode"
                                name="postcode"
                                type="text"
                                className={inputClass(errors.postcode)}
                                value={form.postcode ?? ''}
                                onChange={handleChange}
                                autoComplete="postal-code"
                                placeholder="1234AB"
                                maxLength={6}
                                aria-invalid={!!errors.postcode}
                                aria-describedby={errors.postcode ? 'postcode-error' : undefined}
                            />
                            {errors.postcode && (
                                <p id="postcode-error" className="field-error">
                                    {errors.postcode}
                                </p>
                            )}
                        </div>

                        {errors.general && (
                            <p className="form-error" aria-live="polite">
                                {errors.general}
                            </p>
                        )}
                        {submittedMessage && (
                            <p className="form-success" aria-live="polite">
                                {submittedMessage}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary w-100"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Bezig met registreren...' : 'Registreren'}
                        </button>

                        <p className="login-hint">
                            Heb je al een account?{' '}
                            <button
                                type="button"
                                className="forgot-link"
                                onClick={() => navigate(LOGIN_PATH)}
                            >
                                Inloggen
                            </button>
                        </p>
                    </form>
                </div>

                <div className="hero-right" aria-hidden="true" />
            </div>
        </main>
    );
}
