import { ChangeEvent, FormEvent, useState } from 'react';
import './css/Registration.css';

type FormState = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
};

type RegisterResponse = {
    success: boolean;
    errors?: string[];
};

const initialState: FormState = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
};

export default function Registration() {
    const [form, setForm] = useState<FormState>(initialState);
    const [fieldErrors, setFieldErrors] = useState<Partial<FormState>>({});
    const [serverErrors, setServerErrors] = useState<string[]>([]);
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (key: keyof FormState) => (event: ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [key]: event.target.value }));
    };

    const validate = (values: FormState) => {
        const errors: Partial<FormState> = {};

        if (!values.firstName.trim()) errors.firstName = 'Voornaam is verplicht.';
        if (!values.lastName.trim()) errors.lastName = 'Achternaam is verplicht.';

        if (!values.email.trim()) {
            errors.email = 'E-mailadres is verplicht.';
        } else if (!values.email.includes('@') || !values.email.includes('.')) {
            errors.email = 'Vul een geldig e-mailadres in.';
        }

        if (values.password.length < 6) {
            errors.password = 'Wachtwoord moet minimaal 6 tekens zijn.';
        }

        if (values.confirmPassword !== values.password) {
            errors.confirmPassword = 'Wachtwoorden komen niet overeen.';
        }

        return errors;
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setServerErrors([]);
        setSuccessMessage('');

        const errors = validate(form);
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setSubmitting(true);
        try {
            const response = await fetch('/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: form.email,
                    password: form.password,
                    confirmPassword: form.confirmPassword,
                    firstName: form.firstName,
                    lastName: form.lastName,
                }),
            });

            const data = (await response.json()) as RegisterResponse;

            if (!response.ok || !data.success) {
                setServerErrors(data?.errors ?? ['Registratie mislukt.']);
                return;
            }

            setSuccessMessage('Registratie succesvol, je kunt nu inloggen.');
            setForm(initialState);
            setFieldErrors({});
        } catch (error) {
            setServerErrors(['Er ging iets mis bij het versturen van de registratie.']);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="registration-page">
            <div className="registration-card">
                <h1>Registreren</h1>
                <p className="registration-intro">Maak een account aan om later te kunnen inloggen.</p>

                <form className="registration-form" onSubmit={handleSubmit} noValidate>
                    <div className="form-row">
                        <label>
                            Voornaam
                            <input
                                type="text"
                                value={form.firstName}
                                onChange={handleChange('firstName')}
                                required
                                autoComplete="given-name"
                            />
                        </label>
                        {fieldErrors.firstName && <span className="error-text">{fieldErrors.firstName}</span>}
                    </div>

                    <div className="form-row">
                        <label>
                            Achternaam
                            <input
                                type="text"
                                value={form.lastName}
                                onChange={handleChange('lastName')}
                                required
                                autoComplete="family-name"
                            />
                        </label>
                        {fieldErrors.lastName && <span className="error-text">{fieldErrors.lastName}</span>}
                    </div>

                    <div className="form-row">
                        <label>
                            E-mailadres
                            <input
                                type="email"
                                value={form.email}
                                onChange={handleChange('email')}
                                required
                                autoComplete="email"
                            />
                        </label>
                        {fieldErrors.email && <span className="error-text">{fieldErrors.email}</span>}
                    </div>

                    <div className="form-row">
                        <label>
                            Wachtwoord
                            <input
                                type="password"
                                value={form.password}
                                onChange={handleChange('password')}
                                required
                                minLength={6}
                                autoComplete="new-password"
                            />
                        </label>
                        {fieldErrors.password && <span className="error-text">{fieldErrors.password}</span>}
                    </div>

                    <div className="form-row">
                        <label>
                            Wachtwoord herhalen
                            <input
                                type="password"
                                value={form.confirmPassword}
                                onChange={handleChange('confirmPassword')}
                                required
                                autoComplete="new-password"
                            />
                        </label>
                        {fieldErrors.confirmPassword && (
                            <span className="error-text">{fieldErrors.confirmPassword}</span>
                        )}
                    </div>

                    {serverErrors.length > 0 && (
                        <div className="alert">
                            <p>Registratie mislukt:</p>
                            <ul>
                                {serverErrors.map((error) => (
                                    <li key={error}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {successMessage && <div className="success">{successMessage}</div>}

                    <button type="submit" disabled={submitting}>
                        {submitting ? 'Bezig...' : 'Registreren'}
                    </button>
                </form>
            </div>
        </div>
    );
}
