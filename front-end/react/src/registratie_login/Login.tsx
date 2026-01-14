import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { resolveApiUrl } from '../config/api';
import './css/Registration.css';

/**
 * Request body voor /auth/login.
 */
interface LoginRequest {
    email: string;
    password: string;
    rememberMe: boolean;
}

/**
 * Response van /auth/login.
 * Bij succes komen token + refreshToken mee.
 */
interface LoginResponse {
    success: boolean;
    token?: string;
    refreshToken?: string;
    errors: string[];
}

/**
 * Local state voor formulierfouten per veld + algemene foutmelding.
 */
type FormErrors = {
    email?: string;
    password?: string;
    general?: string;
};

/**
 * Startwaarden van het formulier.
 */
const initialForm: LoginRequest = Object.freeze({
    email: '',
    password: '',
    rememberMe: false
});

/**
 * Helper: geeft de juiste class terug voor een field-group, incl. error styling.
 */
const fieldGroupClass = (err?: string) =>
    `field-group${err ? ' field-group-error' : ''}`;

/**
 * Helper: geeft de juiste class terug voor input, incl. invalid styling.
 */
const inputClass = (err?: string) =>
    `form-control${err ? ' is-invalid' : ''}`;

/**
 * Login pagina/component.
 * Valideert invoer, doet POST naar /auth/login en slaat tokens op in sessionStorage.
 */
export default function Login() {
    const [form, setForm] = useState<LoginRequest>(initialForm);
    const [errors, setErrors] = useState<FormErrors>({});
    const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    /**
     * Update form state bij input changes.
     * - Werkt voor input & checkbox
     * - Reset foutmelding van het betreffende veld
     * - Reset eventuele succesmelding
     */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, type, checked, value } = e.target;
        const newValue = type === 'checkbox' ? checked : value;

        setForm(prev => ({
            ...prev,
            [name]: newValue
        }) as LoginRequest);

        setErrors(prev => ({
            ...prev,
            [name]: undefined
        }));

        setSubmittedMessage(null);
    };

    /**
     * Frontend validatie zodat je niet onnodig een request doet.
     * Controleert email format en minimale wachtwoordlengte.
     */
    const validate = (): FormErrors => {
        const errs: FormErrors = {};
        const email = form.email.trim();

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

        return errs;
    };

    /**
     * Submit handler:
     * - Valideert velden
     * - Stuurt POST request naar backend
     * - Toont errors bij mislukken
     * - Slaat JWT + refresh token op bij succes en navigeert naar home
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Voorkom dubbel submitten
        if (isSubmitting) return;

        setErrors({});
        setSubmittedMessage(null);

        const validationErrors = validate();
        if (Object.values(validationErrors).some(Boolean)) {
            setErrors(validationErrors);
            return;
        }

        // Payload opschonen (email trimmen)
        const payloadToSend: LoginRequest = {
            email: form.email.trim(),
            password: form.password,
            rememberMe: form.rememberMe
        };

        setIsSubmitting(true);

        try {
            const response = await fetch(resolveApiUrl('/auth/login'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadToSend)
            });

            // Probeer response body te lezen (kan leeg zijn)
            let payload: LoginResponse | null = null;

            if (response.headers.get('Content-Length') !== '0') {
                try {
                    payload = (await response.json()) as LoginResponse;
                } catch {
                    payload = null;
                }
            }

            const isUnauthorized = response.status === 401;
            const isOk = response.ok && payload?.success;

            // Fouten tonen (backend errors indien beschikbaar)
            if (!isOk) {
                setErrors({
                    general:
                        payload?.errors?.length
                            ? payload.errors.join('\n')
                            : isUnauthorized
                                ? 'Ongeldige inloggegevens.'
                                : 'Er ging iets mis bij het inloggen.'
                });
                return;
            }

            // Sla tokens op zodat de frontend API-calls kan doen
            if (payload?.success && payload.token && payload.refreshToken) {
                sessionStorage.setItem('token', payload.token);
                sessionStorage.setItem('refreshToken', payload.refreshToken);

                // Custom event zodat de rest van de app kan reageren (bijv. navbar refresh)
                window.dispatchEvent(new Event('login'));
            }

            setSubmittedMessage('Inloggen geslaagd! Je wordt doorgestuurd...');
            setForm(initialForm);

            // Kleine delay voor UX (toon succesmelding), daarna naar home
            setTimeout(() => {
                navigate('/');
            }, 1500);
        } catch {
            setErrors({ general: 'Er ging iets mis bij het inloggen.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="hero">
            <div className="container hero-grid">
                <div className="hero-left">
                    <h1>Inloggen</h1>

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
                                placeholder="naam@bedrijf.nl"
                                autoComplete="email"
                                required
                                aria-invalid={!!errors.email}
                                aria-describedby={errors.email ? 'email-error' : undefined}
                            />
                            {errors.email && (
                                <p id="email-error" className="field-error">
                                    {errors.email}
                                </p>
                            )}
                        </div>

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
                                placeholder="Je wachtwoord"
                                autoComplete="current-password"
                                required
                                aria-invalid={!!errors.password}
                                aria-describedby={errors.password ? 'password-error' : undefined}
                            />
                            {errors.password && (
                                <p id="password-error" className="field-error">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <div className="consent-row consent-row-inline">
                            <label className="checkbox">
                                <input
                                    type="checkbox"
                                    name="rememberMe"
                                    checked={form.rememberMe}
                                    onChange={handleChange}
                                />
                                <span>Onthoud mij</span>
                            </label>
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
                            aria-busy={isSubmitting}
                        >
                            {isSubmitting ? 'Bezig met inloggen...' : 'Inloggen'}
                        </button>

                        <p className="login-hint">
                            Nog geen account? <Link to="/registreren">Registreer hier</Link>
                        </p>
                    </form>
                </div>

                <div className="hero-right" aria-hidden="true" />
            </div>
        </main>
    );
}
