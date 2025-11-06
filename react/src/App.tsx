import { Routes, Route, NavLink } from 'react-router-dom'
import Wpfw from './wpfw'
import Veilingmeester from './veilingmeester/veilingmeester.tsx'

export default function App() {
    return (
        <>
            {/* HEADER / NAVBAR */}
            <header className="sticky-top">
                <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
                    <div className="container">
                        {/* Brand */}
                        <NavLink to="/" className="navbar-brand d-flex align-items-center gap-2">
                            <img
                                src="/webp/floraHolidayLogo.webp"
                                alt="Royal Flora Holland logo"
                                className="border rounded"
                                style={{ height: 50, objectFit: 'contain', outline: '1px solid #fff' }}
                            />
                            <span className="fw-semibold">Flora Royal Holland</span>
                        </NavLink>

                        {/* Toggler (mobile) */}
                        <button
                            className="navbar-toggler"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#mainNav"
                            aria-controls="mainNav"
                            aria-expanded="false"
                            aria-label="Toggle navigation"
                        >
                            <span className="navbar-toggler-icon" />
                        </button>

                        {/* Nav links */}
                        <div className="collapse navbar-collapse" id="mainNav">
                            <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-3">
                                <li className="nav-item d-flex align-items-center">
                                    <img
                                        src="/webp/veilingPlaatsen.webp"
                                        alt=""
                                        aria-hidden="true"
                                        className="me-2 border rounded d-none d-lg-block"
                                        style={{ width: 32, height: 32, objectFit: 'cover', outline: '1px solid #fff' }}
                                    />
                                    <NavLink
                                        to="/"
                                        end
                                        className={({ isActive }) =>
                                            `nav-link px-2 ${isActive ? 'fw-semibold text-success border-bottom border-2 border-success' : 'text-body'}`
                                        }
                                    >
                                        Veiling plaatsen
                                    </NavLink>
                                </li>

                                <li className="nav-item d-flex align-items-center">
                                    <img
                                        src="/webp/mijnVeilingenBekijken.webp"
                                        alt=""
                                        aria-hidden="true"
                                        className="me-2 border rounded d-none d-lg-block"
                                        style={{ width: 32, height: 32, objectFit: 'cover', outline: '1px solid #fff' }}
                                    />
                                    <NavLink
                                        to="/veilingmeester"
                                        className={({ isActive }) =>
                                            `nav-link px-2 ${isActive ? 'fw-semibold text-success border-bottom border-2 border-success' : 'text-body'}`
                                        }
                                    >
                                        Mijn veilingen bekijken
                                    </NavLink>
                                </li>

                                <li className="nav-item d-flex align-items-center">
                                    <img
                                        src="/webp/klantGegevens.webp"
                                        alt=""
                                        aria-hidden="true"
                                        className="me-2 border rounded d-none d-lg-block"
                                        style={{ width: 32, height: 32, objectFit: 'cover', outline: '1px solid #fff' }}
                                    />
                                    <NavLink
                                        to="/gegevens"
                                        className={({ isActive }) =>
                                            `nav-link px-2 ${isActive ? 'fw-semibold text-success border-bottom border-2 border-success' : 'text-body'}`
                                        }
                                    >
                                        Gegevens
                                    </NavLink>
                                </li>
                            </ul>
                        </div>
                    </div>
                </nav>
            </header>

            {/* ROUTES */}
            <main className="container py-4">
                <Routes>
                    <Route path="/" element={<Wpfw />} />
                    <Route path="/veilingmeester" element={<Veilingmeester />} />
                    <Route path="/gegevens" element={<h2 className="h4">Gegevens pagina (coming soon)</h2>} />
                </Routes>
            </main>

            {/* FOOTER */}
            <footer className="position-relative overflow-hidden mt-auto" style={{ backgroundColor: '#C0DDC5' }}>
                {/* Accent block */}
                <div
                    aria-hidden
                    className="position-absolute top-0 start-0 h-100"
                    style={{
                        width: '75%',
                        backgroundColor: '#3A4D41',
                        borderTopRightRadius: 300,
                        zIndex: 0,
                    }}
                />
                <div className="container position-relative" style={{ zIndex: 1 }}>
                    <div className="row align-items-center py-5" style={{ color: '#233127' }}>
                        <div className="col-md-2 d-none d-md-block">
                            <div
                                className="rounded"
                                style={{
                                    width: 80,
                                    height: 80,
                                    backgroundImage: 'url(/webp/floraHolidayLogo.webp)',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}
                            />
                        </div>
                        <div className="col-md-5">
                            <h5 className="mb-2 fw-semibold">Flora Royal Holland</h5>
                            <p className="mb-0">Uw partner in veilen en producten.</p>
                        </div>
                        <div className="col-md-5 text-md-end mt-3 mt-md-0">
                            <h6 className="mb-1 fw-semibold">Contact</h6>
                            <p className="mb-0">
                                <a href="mailto:info@floraroyal.example" className="text-decoration-none" style={{ color: '#233127' }}>
                                    info@floraroyal.example
                                </a>{' '}
                                •{' '}
                                <a href="tel:+31201234567" className="text-decoration-none" style={{ color: '#233127' }}>
                                    +31 20 123 4567
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    )
}
