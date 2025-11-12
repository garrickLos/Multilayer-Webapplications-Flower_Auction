import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Empty,
    Loading,
    Pager,
    SearchInput,
    SelectSm,
    SelectStatusSm,
    StatusBadge,
    cx,
} from "./components";
import { DataTable } from "./DataTable";
import { Modal } from "./Modal";
import { getAuctionDetail } from "./api";
import { useUserBids, useUserRows, useVeilingProductsByGrower, useVeilingRows } from "./hooks";
import { subscribeAuction } from "./live";
import {
    adaptAuction,
    splitProducts,
    statusBadgeVariant,
    statusLabel,
    type UserRow,
    type VeilingDetailDto,
    type VeilingProductRow,
    type VeilingRow,
} from "./types";

const currency = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
const dateTimeFormatter = new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" });

type TabKey = "users" | "auctions";

const soortBadgeClass: Record<UserRow["soort"], string> = {
    koper: "text-bg-primary",
    kweker: "text-bg-success",
    veilingmeester: "text-bg-secondary",
    onbekend: "text-bg-secondary",
};

function formatCurrency(value: number): string {
    return currency.format(Number.isFinite(value) ? value : 0);
}

function formatDateTime(value: string | undefined): string {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date);
}

function parseIsoMs(value: string | undefined): number | undefined {
    if (!value) return undefined;
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? undefined : ms;
}

function isInvalidRange(from?: string, to?: string): boolean {
    const fromMs = parseIsoMs(from);
    const toMs = parseIsoMs(to);
    if (fromMs == null || toMs == null) return false;
    return toMs < fromMs;
}

function readInitialTab(): TabKey {
    if (typeof window === "undefined") return "users";
    const value = new URLSearchParams(window.location.search).get("vm_tab");
    return value === "veilingen" ? "auctions" : "users";
}

function updateTabUrl(tab: TabKey): void {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("vm_tab", tab === "auctions" ? "veilingen" : "gebruikers");
    window.history.replaceState({}, "", url.toString());
}

function useOffline(): boolean {
    const [offline, setOffline] = useState<boolean>(() => (typeof navigator !== "undefined" ? !navigator.onLine : false));
    useEffect(() => {
        const onOnline = () => setOffline(false);
        const onOffline = () => setOffline(true);
        window.addEventListener("online", onOnline);
        window.addEventListener("offline", onOffline);
        return () => {
            window.removeEventListener("online", onOnline);
            window.removeEventListener("offline", onOffline);
        };
    }, []);
    return offline;
}

export function Veilingmeester(): ReactElement {
    const offline = useOffline();
    const [activeTab, setActiveTab] = useState<TabKey>(() => readInitialTab());
    const {
        rows: userRows,
        loading: usersLoading,
        error: usersError,
        page: usersPage,
        setPage: setUsersPage,
        pageSize: usersPageSize,
        setPageSize: setUsersPageSize,
        hasNext: usersHasNext,
        totalResults: usersTotal,
        search: userSearch,
        setSearch: setUserSearch,
    } = useUserRows();
    const {
        rows: auctionRows,
        loading: auctionsLoading,
        error: auctionsError,
        page: auctionsPage,
        setPage: setAuctionsPage,
        pageSize: auctionsPageSize,
        setPageSize: setAuctionsPageSize,
        hasNext: auctionsHasNext,
        totalResults: auctionsTotal,
        status: auctionsStatus,
        setStatus: setAuctionsStatus,
        from: auctionsFrom,
        setFrom: setAuctionsFrom,
        to: auctionsTo,
        setTo: setAuctionsTo,
    } = useVeilingRows();

    const [selectedBidUser, setSelectedBidUser] = useState<UserRow | null>(null);
    const [selectedGrower, setSelectedGrower] = useState<UserRow | null>(null);
    const [selectedAuction, setSelectedAuction] = useState<VeilingRow | null>(null);

    useEffect(() => {
        updateTabUrl(activeTab);
    }, [activeTab]);

    const perPageOptions = useMemo(() => [10, 25, 50].map((size) => ({ value: size, label: `${size}` })), []);

    const handleUserRowClick = useCallback(
        (row: UserRow) => {
            if (row.soort === "koper") {
                setSelectedBidUser(row);
            } else if (row.soort === "kweker") {
                setSelectedGrower(row);
            }
        },
        [],
    );

    const handleAuctionClick = useCallback((row: VeilingRow) => {
        setSelectedAuction(row);
    }, []);

    const isUserInteractive = useCallback((row: UserRow) => row.soort === "koper" || row.soort === "kweker", []);

    const auctionsRangeInvalid = isInvalidRange(auctionsFrom, auctionsTo);

    return (
        <div className="container-fluid py-4">
            <header className="mb-4">
                <h1 className="h2 fw-semibold mb-1">Veiling</h1>
                <p className="text-muted mb-0 small">Beheer gebruikers, veilingen en klokken.</p>
            </header>
            {offline && (
                <div className="mb-3">
                    <Alert variant="warning">Je bent offline. Gegevens verversen zodra de verbinding terug is.</Alert>
                </div>
            )}
            <nav className="mb-3" role="tablist" aria-label="Veiling tabs">
                <div className="nav nav-tabs rounded-3">
                    <button
                        type="button"
                        className={cx("nav-link", activeTab === "users" && "active")}
                        role="tab"
                        aria-selected={activeTab === "users"}
                        aria-controls="tab-gebruikers"
                        id="tab-gebruikers-tab"
                        onClick={() => setActiveTab("users")}
                    >
                        Gebruikers
                    </button>
                    <button
                        type="button"
                        className={cx("nav-link", activeTab === "auctions" && "active")}
                        role="tab"
                        aria-selected={activeTab === "auctions"}
                        aria-controls="tab-veilingen"
                        id="tab-veilingen-tab"
                        onClick={() => setActiveTab("auctions")}
                    >
                        Veilingen
                    </button>
                </div>
            </nav>
            <section
                id="tab-gebruikers"
                role="tabpanel"
                aria-labelledby="tab-gebruikers-tab"
                hidden={activeTab !== "users"}
                className="d-flex flex-column gap-3"
            >
                <div className="card border-0 shadow-sm rounded-4">
                    <div className="card-body">
                        <div className="row g-3 align-items-end">
                            <div className="col-12 col-md-6 col-lg-4">
                                <SearchInput label="Zoeken" value={userSearch ?? ""} onChange={(value) => setUserSearch?.(value)} />
                            </div>
                            <div className="col-6 col-md-3 col-lg-2">
                                <SelectSm<number>
                                    label="Per pagina"
                                    value={usersPageSize}
                                    onChange={setUsersPageSize}
                                    options={perPageOptions}
                                    parse={(raw) => Number(raw)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                {usersError && <Alert>{usersError}</Alert>}
                {usersLoading && !userRows.length ? (
                    <Loading />
                ) : userRows.length === 0 ? (
                    <Empty message="Geen gebruikers gevonden." />
                ) : (
                    <DataTable
                        columns={[
                            { key: "id", header: "#", width: "5rem", sortable: true },
                            {
                                key: "naam",
                                header: "Naam",
                                sortable: true,
                                render: (row) => (
                                    <div>
                                        <div className="fw-semibold">{row.naam}</div>
                                        <div className="text-muted small">#{row.id}</div>
                                    </div>
                                ),
                                getValue: (row) => row.naam,
                            },
                            {
                                key: "email",
                                header: "E-mail",
                                sortable: true,
                                render: (row) => (row.email ? <span className="text-truncate d-inline-block" style={{ maxWidth: 220 }}>{row.email}</span> : <span className="text-muted">—</span>),
                                getValue: (row) => row.email ?? "",
                            },
                            {
                                key: "kvk",
                                header: "KVK",
                                sortable: true,
                                render: (row) => (
                                    <span className="font-monospace" title={row.kvk ? undefined : "Geen KVK"}>
                                        {row.kvk ?? "—"}
                                    </span>
                                ),
                                getValue: (row) => row.kvk ?? "",
                            },
                            {
                                key: "soort",
                                header: "Soort",
                                sortable: true,
                                render: (row) => (
                                    <span className={cx("badge", "rounded-pill", soortBadgeClass[row.soort] ?? "text-bg-secondary")}>{row.soort}</span>
                                ),
                                getValue: (row) => row.soort,
                            },
                            {
                                key: "status",
                                header: "Status",
                                sortable: true,
                                render: (row) => <StatusBadge status={row.status} />,
                                getValue: (row) => row.status,
                            },
                        ]}
                        rows={userRows}
                        totalResults={usersTotal}
                        empty={<Empty message="Geen gebruikers gevonden." />}
                        getRowKey={(row) => String(row.id)}
                        onRowClick={handleUserRowClick}
                        isRowInteractive={isUserInteractive}
                    />
                )}
                <Pager
                    page={usersPage}
                    pageSize={usersPageSize}
                    hasNext={usersHasNext}
                    onPrevious={() => setUsersPage((prev) => Math.max(1, prev - 1))}
                    onNext={() => setUsersPage((prev) => prev + 1)}
                    totalResults={usersTotal}
                />
            </section>
            <section
                id="tab-veilingen"
                role="tabpanel"
                aria-labelledby="tab-veilingen-tab"
                hidden={activeTab !== "auctions"}
                className="d-flex flex-column gap-3"
            >
                <div className="card border-0 shadow-sm rounded-4">
                    <div className="card-body">
                        <div className="row g-3 align-items-end">
                            <div className="col-6 col-lg-2">
                                <SelectSm<number>
                                    label="Per pagina"
                                    value={auctionsPageSize}
                                    onChange={setAuctionsPageSize}
                                    options={perPageOptions}
                                    parse={(raw) => Number(raw)}
                                />
                            </div>
                            <div className="col-6 col-lg-2">
                                <SelectStatusSm
                                    label="Status"
                                    value={auctionsStatus ?? "alle"}
                                    onChange={(value) => setAuctionsStatus?.(value)}
                                />
                            </div>
                            <div className="col-6 col-lg-2">
                                <label htmlFor="filter-from" className="form-label small text-uppercase text-muted mb-1">
                                    Vanaf
                                </label>
                                <input
                                    id="filter-from"
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={auctionsFrom ?? ""}
                                    onChange={(event) => setAuctionsFrom?.(event.target.value)}
                                    title="jjjj-mm-dd"
                                    aria-invalid={auctionsRangeInvalid}
                                />
                            </div>
                            <div className="col-6 col-lg-2">
                                <label htmlFor="filter-to" className="form-label small text-uppercase text-muted mb-1">
                                    Tot en met
                                </label>
                                <input
                                    id="filter-to"
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={auctionsTo ?? ""}
                                    onChange={(event) => setAuctionsTo?.(event.target.value)}
                                    title="jjjj-mm-dd"
                                    aria-invalid={auctionsRangeInvalid}
                                />
                            </div>
                            {auctionsRangeInvalid && (
                                <div className="col-12">
                                    <div className="text-danger small">Einddatum moet na begindatum liggen.</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {auctionsError && <Alert>{auctionsError}</Alert>}
                {auctionsLoading && !auctionRows.length ? (
                    <Loading />
                ) : auctionRows.length === 0 ? (
                    <Empty message="Geen veilingen gevonden." />
                ) : (
                    <DataTable
                        columns={[
                            { key: "id", header: "#", sortable: true, width: "5rem" },
                            {
                                key: "titel",
                                header: "Titel",
                                sortable: true,
                                render: (row) => (
                                    <div>
                                        <div className="fw-semibold">{row.titel}</div>
                                        <div className="text-muted small">{formatDateTime(row.startIso)} • {formatDateTime(row.endIso)}</div>
                                    </div>
                                ),
                                getValue: (row) => row.titel,
                            },
                            {
                                key: "startIso",
                                header: "Start",
                                sortable: true,
                                render: (row) => formatDateTime(row.startIso),
                                getValue: (row) => row.startIso ?? "",
                            },
                            {
                                key: "endIso",
                                header: "Eind",
                                sortable: true,
                                render: (row) => formatDateTime(row.endIso),
                                getValue: (row) => row.endIso ?? "",
                            },
                            {
                                key: "status",
                                header: "Status",
                                sortable: true,
                                render: (row) => <StatusBadge status={row.status} />,
                                getValue: (row) => row.status,
                            },
                            {
                                key: "productCount",
                                header: "Producten",
                                sortable: true,
                                render: (row) => <span className="badge text-bg-secondary">{row.productCount}</span>,
                                getValue: (row) => row.productCount,
                            },
                        ]}
                        rows={auctionRows}
                        totalResults={auctionsTotal}
                        empty={<Empty message="Geen veilingen gevonden." />}
                        getRowKey={(row) => String(row.id)}
                        onRowClick={handleAuctionClick}
                    />
                )}
                <Pager
                    page={auctionsPage}
                    pageSize={auctionsPageSize}
                    hasNext={auctionsHasNext}
                    onPrevious={() => setAuctionsPage((prev) => Math.max(1, prev - 1))}
                    onNext={() => setAuctionsPage((prev) => prev + 1)}
                    totalResults={auctionsTotal}
                />
            </section>
            {selectedBidUser && <BidsModal user={selectedBidUser} onClose={() => setSelectedBidUser(null)} />}
            {selectedGrower && <ProductsModal user={selectedGrower} onClose={() => setSelectedGrower(null)} />}
            {selectedAuction && <AuctionModal row={selectedAuction} onClose={() => setSelectedAuction(null)} />}
        </div>
    );
}

type BidsModalProps = { user: UserRow; onClose: () => void };

function BidsModal({ user, onClose }: BidsModalProps): ReactElement {
    const { rows, loading, error, page, setPage, pageSize, setPageSize, hasNext, totalResults, from, setFrom, to, setTo } = useUserBids(
        user.id,
    );
    const invalidRange = isInvalidRange(from, to);

    return (
        <Modal
            title={
                <div>
                    <div className="fw-semibold">Biedingen koper {user.naam}</div>
                    <div className="text-muted small">#{user.id}</div>
                </div>
            }
            onClose={onClose}
            size="lg"
            footer={
                <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                    Sluiten
                </button>
            }
        >
            <div className="row g-3 align-items-end mb-3">
                <div className="col-6 col-lg-3">
                    <label htmlFor="bids-from" className="form-label small text-uppercase text-muted mb-1">
                        Vanaf
                    </label>
                    <input
                        id="bids-from"
                        type="date"
                        className="form-control form-control-sm"
                        value={from ?? ""}
                        onChange={(event) => setFrom?.(event.target.value)}
                        title="jjjj-mm-dd"
                        aria-invalid={invalidRange}
                    />
                </div>
                <div className="col-6 col-lg-3">
                    <label htmlFor="bids-to" className="form-label small text-uppercase text-muted mb-1">
                        Tot en met
                    </label>
                    <input
                        id="bids-to"
                        type="date"
                        className="form-control form-control-sm"
                        value={to ?? ""}
                        onChange={(event) => setTo?.(event.target.value)}
                        title="jjjj-mm-dd"
                        aria-invalid={invalidRange}
                    />
                    {invalidRange && <div className="text-danger small mt-1">Einddatum moet na begindatum liggen.</div>}
                </div>
                <div className="col-6 col-lg-2">
                    <SelectSm<number>
                        label="Per pagina"
                        value={pageSize}
                        onChange={setPageSize}
                        options={[10, 25, 50].map((size) => ({ value: size, label: `${size}` }))}
                        parse={(raw) => Number(raw)}
                    />
                </div>
            </div>
            {error && <Alert>{error}</Alert>}
            {loading && !rows.length ? (
                <Loading />
            ) : rows.length === 0 ? (
                <Empty message="Geen biedingen gevonden." />
            ) : (
                <DataTable
                    columns={[
                        { key: "id", header: "#", width: "5rem" },
                        {
                            key: "bedragPerFust",
                            header: "Prijs per fust",
                            sortable: true,
                            render: (row) => formatCurrency(row.bedragPerFust),
                            getValue: (row) => row.bedragPerFust,
                        },
                        {
                            key: "aantalStuks",
                            header: "Aantal stuks",
                            sortable: true,
                            render: (row) => row.aantalStuks,
                            getValue: (row) => row.aantalStuks,
                        },
                        {
                            key: "datumIso",
                            header: "Datum",
                            sortable: true,
                            render: (row) => formatDateTime(row.datumIso),
                            getValue: (row) => row.datumIso ?? "",
                        },
                        {
                            key: "status",
                            header: "Status",
                            sortable: true,
                            render: (row) => <StatusBadge status={row.status} />,
                            getValue: (row) => row.status,
                        },
                    ]}
                    rows={rows}
                    totalResults={totalResults}
                    empty={<Empty message="Geen biedingen gevonden." />}
                    getRowKey={(row) => String(row.id)}
                />
            )}
            <Pager
                page={page}
                pageSize={pageSize}
                hasNext={hasNext}
                onPrevious={() => setPage((prev) => Math.max(1, prev - 1))}
                onNext={() => setPage((prev) => prev + 1)}
                totalResults={totalResults}
            />
        </Modal>
    );
}

type ProductsModalProps = { user: UserRow; onClose: () => void };

function ProductsModal({ user, onClose }: ProductsModalProps): ReactElement {
    const { rows, loading, error, page, setPage, pageSize, setPageSize, hasNext, totalResults } = useVeilingProductsByGrower(
        user.id,
    );

    return (
        <Modal
            title={
                <div>
                    <div className="fw-semibold">Producten kweker {user.naam}</div>
                    <div className="text-muted small">#{user.id}</div>
                </div>
            }
            onClose={onClose}
            size="xl"
            footer={
                <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                    Sluiten
                </button>
            }
        >
            <div className="row g-3 align-items-end mb-3">
                <div className="col-6 col-lg-2">
                    <SelectSm<number>
                        label="Per pagina"
                        value={pageSize}
                        onChange={setPageSize}
                        options={[10, 25, 50].map((size) => ({ value: size, label: `${size}` }))}
                        parse={(raw) => Number(raw)}
                    />
                </div>
            </div>
            {error && <Alert>{error}</Alert>}
            {loading && !rows.length ? (
                <Loading />
            ) : rows.length === 0 ? (
                <Empty message="Geen producten gevonden." />
            ) : (
                <DataTable
                    columns={[
                        { key: "id", header: "#", width: "5rem" },
                        {
                            key: "naam",
                            header: "Product",
                            sortable: true,
                            render: (row) => (
                                <div className="d-flex align-items-center gap-2">
                                    {row.image ? (
                                        <img
                                            src={row.image}
                                            alt=""
                                            width={40}
                                            height={40}
                                            className="rounded-3 border"
                                            style={{ objectFit: "cover" }}
                                        />
                                    ) : (
                                        <span className="badge text-bg-light">Geen afbeelding</span>
                                    )}
                                    <div>
                                        <div className="fw-semibold">{row.naam}</div>
                                        <div className="text-muted small">{row.categorie || "Categorie onbekend"}</div>
                                    </div>
                                </div>
                            ),
                            getValue: (row) => row.naam,
                        },
                        {
                            key: "voorraad",
                            header: "Voorraad (bloemen)",
                            sortable: true,
                            render: (row) => (row.voorraad != null ? row.voorraad : "—"),
                            getValue: (row) => row.voorraad ?? "",
                        },
                        {
                            key: "fust",
                            header: "Fust",
                            sortable: true,
                            render: (row) => (row.fust != null ? row.fust : "—"),
                            getValue: (row) => row.fust ?? "",
                        },
                        {
                            key: "piecesPerBundle",
                            header: "Stuks/bundel",
                            sortable: true,
                            render: (row) => (row.piecesPerBundle != null ? row.piecesPerBundle : "—"),
                            getValue: (row) => row.piecesPerBundle ?? "",
                        },
                        {
                            key: "minPrice",
                            header: "Min. prijs",
                            sortable: true,
                            render: (row) => formatCurrency(row.minPrice),
                            getValue: (row) => row.minPrice,
                        },
                        {
                            key: "status",
                            header: "Status",
                            sortable: true,
                            render: (row) => <StatusBadge status={row.status} />,
                            getValue: (row) => row.status,
                        },
                    ]}
                    rows={rows}
                    totalResults={totalResults}
                    empty={<Empty message="Geen producten gevonden." />}
                    getRowKey={(row) => String(row.id)}
                />
            )}
            <Pager
                page={page}
                pageSize={pageSize}
                hasNext={hasNext}
                onPrevious={() => setPage((prev) => Math.max(1, prev - 1))}
                onNext={() => setPage((prev) => prev + 1)}
                totalResults={totalResults}
            />
        </Modal>
    );
}

type AuctionModalProps = { row: VeilingRow; onClose: () => void };

function AuctionModal({ row, onClose }: AuctionModalProps): ReactElement {
    const [detail, setDetail] = useState<VeilingDetailDto | null>(null);
    const [currentRow, setCurrentRow] = useState<VeilingRow>(row);
    const [currentPrice, setCurrentPrice] = useState<number>(row.maxPrice);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const subscriptionRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        setDetail(null);
        setCurrentRow(row);
        setCurrentPrice(row.maxPrice);
    }, [row]);

    const detailId = row.veilingNr ?? row.id;

    const fetchDetail = useCallback(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(null);
        getAuctionDetail(detailId, controller.signal)
            .then((data) => {
                setDetail(data);
                setCurrentRow(adaptAuction(data));
            })
            .catch((err) => {
                if ((err as { name?: string }).name === "AbortError") return;
                setError((err as { message?: string }).message ?? "Er ging iets mis.");
            })
            .finally(() => {
                setLoading(false);
            });
        return () => controller.abort();
    }, [detailId]);

    useEffect(() => fetchDetail(), [fetchDetail]);

    useEffect(() => {
        subscriptionRef.current?.();
        subscriptionRef.current = subscribeAuction(row.veilingNr ?? row.id, (update) => {
            setCurrentRow((prev) => ({ ...prev, ...update }));
        });
        return () => {
            subscriptionRef.current?.();
            subscriptionRef.current = null;
        };
    }, [row.id, row.veilingNr]);

    useEffect(() => {
        const updatePrice = () => {
            if (currentRow.status !== "active") {
                setCurrentPrice(currentRow.minPrice);
                return;
            }
            const startMs = parseIsoMs(currentRow.startIso) ?? Date.now();
            const endMs = parseIsoMs(currentRow.endIso) ?? Date.now();
            if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
                setCurrentPrice(currentRow.maxPrice);
                return;
            }
            const now = Date.now();
            if (now <= startMs) {
                setCurrentPrice(currentRow.maxPrice);
                return;
            }
            if (now >= endMs) {
                setCurrentPrice(currentRow.minPrice);
                return;
            }
            const progress = (now - startMs) / (endMs - startMs);
            const diff = currentRow.maxPrice - currentRow.minPrice;
            const price = currentRow.maxPrice - diff * progress;
            setCurrentPrice(Number(price.toFixed(2)));
        };
        updatePrice();
        const timer = window.setInterval(updatePrice, 1000);
        return () => window.clearInterval(timer);
    }, [currentRow.endIso, currentRow.maxPrice, currentRow.minPrice, currentRow.startIso, currentRow.status]);

    const { active, inactive } = useMemo(
        () => (detail ? splitProducts(detail) : { active: [] as readonly VeilingProductRow[], inactive: [] as readonly VeilingProductRow[] }),
        [detail],
    );

    const progressPercent = useMemo(() => {
        if (currentRow.maxPrice <= currentRow.minPrice) return 0;
        const ratio = (currentPrice - currentRow.minPrice) / (currentRow.maxPrice - currentRow.minPrice);
        return Math.max(0, Math.min(100, Math.round(ratio * 100)));
    }, [currentPrice, currentRow.maxPrice, currentRow.minPrice]);

    const clockStatic = currentRow.maxPrice === currentRow.minPrice;

    return (
        <Modal
            title={`Veiling ${currentRow.veilingNr ?? row.id}`}
            onClose={onClose}
            size="xl"
            footer={
                <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                    Sluiten
                </button>
            }
        >
            {error && <Alert>{error}</Alert>}
            {loading && !detail ? (
                <Loading />
            ) : (
                <div className="d-flex flex-column gap-3">
                    <div className="d-flex flex-column flex-lg-row gap-3 align-items-lg-start justify-content-between">
                        <div>
                            <h3 className="h4 fw-semibold mb-1">{currentRow.titel}</h3>
                            <p className="text-muted mb-0 small">
                                {formatDateTime(currentRow.startIso)} • {formatDateTime(currentRow.endIso)}
                            </p>
                        </div>
                        <span className={cx("badge", "rounded-pill", statusBadgeVariant(currentRow.status))}>{statusLabel(currentRow.status)}</span>
                    </div>
                    <div className="card border-0 shadow-sm rounded-4">
                        <div className="card-body">
                            <p className="text-muted text-uppercase small mb-1">Klokprijs</p>
                            <div className="display-5 fw-semibold" aria-live="polite">
                                {formatCurrency(currentPrice)}
                            </div>
                            <p className="text-muted mb-2">Van {formatCurrency(currentRow.maxPrice)} naar {formatCurrency(currentRow.minPrice)}</p>
                            {clockStatic ? (
                                <div className="text-muted small">Klok staat stil</div>
                            ) : (
                                <div className="progress" style={{ height: 8 }} aria-hidden="true">
                                    <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
                                </div>
                            )}
                        </div>
                    </div>
                    <section className="d-flex flex-column gap-2">
                        <h4 className="h6 text-uppercase text-muted mb-0">Actieve producten</h4>
                        {active.length === 0 ? (
                            <Empty message="Geen actieve producten." />
                        ) : (
                            <DataTable
                                columns={productColumns}
                                rows={active}
                                getRowKey={(item) => String(item.id)}
                                totalResults={active.length}
                            />
                        )}
                    </section>
                    <section className="d-flex flex-column gap-2">
                        <h4 className="h6 text-uppercase text-muted mb-0">Inactief of geannuleerd</h4>
                        {inactive.length === 0 ? (
                            <Empty message="Geen inactieve producten." />
                        ) : (
                            <DataTable
                                columns={productColumns}
                                rows={inactive}
                                getRowKey={(item) => `inactive-${item.id}`}
                                totalResults={inactive.length}
                            />
                        )}
                    </section>
                </div>
            )}
        </Modal>
    );
}

const productColumns = [
    { key: "id", header: "#", width: "5rem" },
    {
        key: "naam",
        header: "Product",
        sortable: true,
        render: (row: VeilingProductRow) => (
            <div className="d-flex align-items-center gap-2">
                {row.image ? (
                    <img src={row.image} alt="" width={40} height={40} className="rounded-3 border" style={{ objectFit: "cover" }} />
                ) : (
                    <span className="badge text-bg-light">Geen afbeelding</span>
                )}
                <div>
                    <div className="fw-semibold">{row.naam}</div>
                    <div className="text-muted small">{row.categorie || "Categorie onbekend"}</div>
                </div>
            </div>
        ),
        getValue: (row: VeilingProductRow) => row.naam,
    },
    {
        key: "voorraad",
        header: "Voorraad (bloemen)",
        sortable: true,
        render: (row: VeilingProductRow) => (row.voorraad != null ? row.voorraad : "—"),
        getValue: (row: VeilingProductRow) => row.voorraad ?? "",
    },
    {
        key: "fust",
        header: "Fust",
        sortable: true,
        render: (row: VeilingProductRow) => (row.fust != null ? row.fust : "—"),
        getValue: (row: VeilingProductRow) => row.fust ?? "",
    },
    {
        key: "piecesPerBundle",
        header: "Stuks/bundel",
        sortable: true,
        render: (row: VeilingProductRow) => (row.piecesPerBundle != null ? row.piecesPerBundle : "—"),
        getValue: (row: VeilingProductRow) => row.piecesPerBundle ?? "",
    },
    {
        key: "minPrice",
        header: "Min. prijs",
        sortable: true,
        render: (row: VeilingProductRow) => formatCurrency(row.minPrice),
        getValue: (row: VeilingProductRow) => row.minPrice,
    },
    {
        key: "status",
        header: "Status",
        sortable: true,
        render: (row: VeilingProductRow) => <StatusBadge status={row.status} />,
        getValue: (row: VeilingProductRow) => row.status,
    },
] as const;
