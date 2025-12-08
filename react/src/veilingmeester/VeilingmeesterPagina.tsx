import { useEffect, useState } from "react";
import type { Bieding, Gebruiker, Veiling, Veilingproduct } from "./api";
import {
    fetchActieveVeilingen,
    fetchBiedingen,
    fetchVeilingmeesterGebruiker,
    fetchVeilingproducten,
} from "./api";

export default function VeilingmeesterPagina() {
    const [gebruiker, setGebruiker] = useState<Gebruiker | null>(null);
    const [veilingen, setVeilingen] = useState<Veiling[]>([]);
    const [producten, setProducten] = useState<Veilingproduct[]>([]);
    const [biedingen, setBiedingen] = useState<Bieding[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const load = async () => {
            try {
                setLoading(true);
                setError(null);

                const [userResponse, veilingResponse, productResponse, bidResponse] = await Promise.all([
                    fetchVeilingmeesterGebruiker(controller.signal),
                    fetchActieveVeilingen(controller.signal),
                    fetchVeilingproducten(controller.signal),
                    fetchBiedingen(controller.signal),
                ]);

                setGebruiker(userResponse);
                setVeilingen(veilingResponse);
                setProducten(productResponse);
                setBiedingen(bidResponse);
            } catch (err) {
                if ((err as { name?: string }).name === "AbortError") return;
                setError((err as Error).message || "Er is iets misgegaan bij het ophalen van de gegevens.");
            } finally {
                setLoading(false);
            }
        };

        void load();

        return () => controller.abort();
    }, []);

    return (
        <main className="container py-4 d-flex flex-column gap-3">
            <header>
                <h1 className="h3">Veilingmeester dashboard</h1>
                <p className="text-muted mb-0">
                    Data wordt opgehaald via de Vite proxy (/api) zonder cookies om CORS-fouten te voorkomen.
                </p>
            </header>

            {loading && <div className="alert alert-info">Gegevens worden geladen…</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {gebruiker && (
                <section>
                    <h2 className="h5">Ingelogde veilingmeester</h2>
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <dl className="row mb-0">
                                <dt className="col-sm-3">Naam</dt>
                                <dd className="col-sm-9">{gebruiker.naam}</dd>
                                <dt className="col-sm-3">E-mail</dt>
                                <dd className="col-sm-9">{gebruiker.email}</dd>
                                {gebruiker.rol && (
                                    <>
                                        <dt className="col-sm-3">Rol</dt>
                                        <dd className="col-sm-9">{gebruiker.rol}</dd>
                                    </>
                                )}
                                {gebruiker.status && (
                                    <>
                                        <dt className="col-sm-3">Status</dt>
                                        <dd className="col-sm-9">{gebruiker.status}</dd>
                                    </>
                                )}
                            </dl>
                        </div>
                    </div>
                </section>
            )}

            <section>
                <h2 className="h5">Actieve veilingen</h2>
                {veilingen.length === 0 ? (
                    <p className="text-muted">Geen veilingen gevonden.</p>
                ) : (
                    <ul className="list-group shadow-sm">
                        {veilingen.map((veiling) => (
                            <li key={veiling.id} className="list-group-item d-flex justify-content-between">
                                <div>
                                    <div className="fw-semibold">{veiling.titel}</div>
                                    <div className="small text-muted">
                                        {veiling.begintijd} – {veiling.eindtijd}
                                    </div>
                                </div>
                                {veiling.status && <span className="badge bg-success-subtle text-success">{veiling.status}</span>}
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section>
                <h2 className="h5">Veilingproducten</h2>
                {producten.length === 0 ? (
                    <p className="text-muted">Geen producten gevonden.</p>
                ) : (
                    <ul className="list-group shadow-sm">
                        {producten.map((product) => (
                            <li key={product.id} className="list-group-item d-flex justify-content-between align-items-start">
                                <div>
                                    <div className="fw-semibold">{product.naam}</div>
                                    <div className="small text-muted">Min. prijs: €{product.minimumprijs.toFixed(2)}</div>
                                    {product.plaats && <div className="small text-muted">{product.plaats}</div>}
                                </div>
                                {product.veilingNr && (
                                    <span className="badge bg-info-subtle text-info">Veiling #{product.veilingNr}</span>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section>
                <h2 className="h5">Laatste biedingen</h2>
                {biedingen.length === 0 ? (
                    <p className="text-muted">Geen biedingen gevonden.</p>
                ) : (
                    <ul className="list-group shadow-sm">
                        {biedingen.map((bid) => (
                            <li key={bid.id} className="list-group-item d-flex justify-content-between">
                                <div>
                                    <div className="fw-semibold">Bieding #{bid.id}</div>
                                    <div className="small text-muted">Gebruiker #{bid.gebruikerNr}</div>
                                </div>
                                <div className="text-end">
                                    <div className="fw-semibold">€{bid.bedragPerFust.toFixed(2)}</div>
                                    <div className="small text-muted">Aantal: {bid.aantalStuks}</div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </main>
    );
}
