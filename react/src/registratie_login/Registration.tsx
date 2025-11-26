import React, { useState } from 'react';
import './css/Registration.css';

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

interface RegisterResponse {
    success: boolean;
    errors: string[];
}

type FormErrors = Partial<Record<keyof RegisterRequest, string>> & { general?: string };

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

export default function Registration() {
    const [form, setForm] = useState<RegisterRequest>(initialForm);
    const [errors, setErrors] = useState<FormErrors>({});
    const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const validate = (): FormErrors => {
        const newErrors: FormErrors = {};

        if (!form.email) {
            newErrors.email = 'E-mailadres is verplicht.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            newErrors.email = 'E-mailadres is ongeldig.';
        }

        if (!form.password) {
            newErrors.password = 'Wachtwoord is verplicht.';
        } else if (form.password.length < 6) {
            newErrors.password = 'Wachtwoord moet minimaal 6 tekens bevatten.';
        }

        if (!form.confirmPassword) {
            newErrors.confirmPassword = 'Bevestig je wachtwoord.';
        } else if (form.confirmPassword !== form.password) {
            newErrors.confirmPassword = 'Wachtwoorden komen niet overeen.';
        }

        if (!form.bedrijfsNaam) {
            newErrors.bedrijfsNaam = 'Bedrijfsnaam is verplicht.';
        }

        if (!form.soort) {
            newErrors.soort = 'Selecteer een soort (bijv. Bedrijf of Koper).';
        }

        return newErrors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittedMessage(null);
        setErrors({});

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            const payload: RegisterResponse = await response.json();

            if (payload.success) {
                setSubmittedMessage('Registratie succesvol, je kunt nu inloggen.');
                setForm(initialForm);
            } else {
                setErrors({ general: payload.errors.join('\n') });
            }
        } catch (err) {
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
                        <div className="field-group">
                            <label className="field-label" htmlFor="email">E-mailadres</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                autoComplete="email"
                            />
                            {errors.email && <p className="field-error">{errors.email}</p>}
                        </div>

                        <div className="grid-2">
                            <div className="field-group">
                                <label className="field-label" htmlFor="password">Wachtwoord</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
                                />
                                {errors.password && <p className="field-error">{errors.password}</p>}
                            </div>
                            <div className="field-group">
                                <label className="field-label" htmlFor="confirmPassword">Bevestig wachtwoord</label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
                                />
                                {errors.confirmPassword && <p className="field-error">{errors.confirmPassword}</p>}
                            </div>
                        </div>

                        <div className="grid-2">
                            <div className="field-group">
                                <label className="field-label" htmlFor="bedrijfsNaam">Bedrijfsnaam</label>
                                <input
                                    id="bedrijfsNaam"
                                    name="bedrijfsNaam"
                                    type="text"
                                    value={form.bedrijfsNaam}
                                    onChange={handleChange}
                                    required
                                />
                                {errors.bedrijfsNaam && <p className="field-error">{errors.bedrijfsNaam}</p>}
                            </div>
                            <div className="field-group">
                                <label className="field-label" htmlFor="soort">Soort</label>
                                <select
                                    id="soort"
                                    name="soort"
                                    value={form.soort}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="" disabled>Kies een soort</option>
                                    <option value="Bedrijf">Bedrijf</option>
                                    <option value="Koper">Koper</option>
                                </select>
                                {errors.soort && <p className="field-error">{errors.soort}</p>}
                            </div>
                        </div>

                        <div className="grid-2">
                            <div className="field-group">
                                <label className="field-label" htmlFor="kvk">KvK (optioneel)</label>
                                <input
                                    id="kvk"
                                    name="kvk"
                                    type="text"
                                    value={form.kvk ?? ''}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="field-group">
                                <label className="field-label" htmlFor="straatAdres">Straat + huisnummer (optioneel)</label>
                                <input
                                    id="straatAdres"
                                    name="straatAdres"
                                    type="text"
                                    value={form.straatAdres ?? ''}
                                    onChange={handleChange}
                                    autoComplete="address-line1"
                                />
                            </div>
                        </div>

                        <div className="field-group">
                            <label className="field-label" htmlFor="postcode">Postcode (optioneel)</label>
                            <input
                                id="postcode"
                                name="postcode"
                                type="text"
                                value={form.postcode ?? ''}
                                onChange={handleChange}
                                autoComplete="postal-code"
                            />
                        </div>

                        {errors.general && (
                            <p className="form-error" aria-live="polite">{errors.general}</p>
                        )}
                        {submittedMessage && (
                            <p className="form-success" aria-live="polite">{submittedMessage}</p>
                        )}

                        <button type="submit" className="btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Bezig met registreren...' : 'Registreren'}
                        </button>
                    </form>
                </div>

                <div className="hero-right" aria-hidden="true" />
            </div>
        </main>
    );
}
