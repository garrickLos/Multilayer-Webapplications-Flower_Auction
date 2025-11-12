import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Empty, Loading, Pager, SearchInput, SelectSm, SelectStatusSm, StatusBadge, cx } from "./components";
import { DataTable } from "./DataTable";
import { Modal } from "./Modal";
import { getAuctionDetail } from "./api";
import { useUserBids, useUserRows, useVeilingProductsByGrower, useVeilingRows } from "./hooks";
import { subscribeAuction } from "./live";
import { adaptAuction, splitProducts, statusBadgeVariant, statusLabel, type UserRow, type VeilingDetailDto, type VeilingProductRow, type VeilingRow } from "./types";

const currency = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
const dateTimeFormatter = new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" });

function formatCurrency(value: number): string {
    return currency.format(Number.isFinite(value) ? value : 0);
}

function formatDateTime(value: string | undefined): string {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date);
}

function exportCsv(filename: string, rows: Array<Record<string, unknown>>): void {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const escape = (value: unknown) => `"${String(value ?? "").replace(/"/gu, '""')}"`;
    const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
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

const soortBadgeClass: Record<string, string> = {
    koper: "text-bg-primary",
    kweker: "text-bg-success",
    veilingmeester: "text-bg-dark",
    onbekend: "text-bg-secondary",
};

type TabKey = "users" | "auctions";

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

function computeClockPrice(nowMs: number, startMs: number, endMs: number, max: number, min: number): number {
    if (max <= min) return min;
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return max;
    if (nowMs <= startMs) return max;
    if (nowMs >= endMs) return min;
    const progress = (nowMs - startMs) / (endMs - startMs);
    const current = max - (max - min) * progress;
    return Math.min(max, Math.max(min, Number(current.toFixed(2))));
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

    const perPageOptions = useMemo(
        () => [10, 25, 50].map((size) => ({ value: size, label: `${size}` })),
        [],
    );

    const handleUserRowClick = useCallback(
        (row: UserRow) => {
            if (row.soort === "koper") {
                setSelectedBidUser(row);
            } else if (row.soort === "kweker") {
                setSelectedGrower(row);
            } else {
                setSelectedBidUser(row);
            }
        },
        [],
    );

    const handleAuctionClick = useCallback((row: VeilingRow) => {
        setSelectedAuction(row);
    }, []);

    const exportUsers = useCallback(() => {
        exportCsv(
            "gebruikers.csv",
            userRows.map((row) => ({
                Nummer: row.id,
                Naam: row.naam,
                Email: row.email,
                KVK: row.kvk ?? "",
                Soort: row.soort,
                Status: statusLabel(row.status),
            })),
        );
    }, [userRows]);

    const exportAuctions = useCallback(() => {
        exportCsv(
            "veilingen.csv",
            auctionRows.map((row) => ({
                Nummer: row.veilingNr ?? row.id,
                Titel: row.titel,
                Start: formatDateTime(row.startIso),
                Einde: formatDateTime(row.endIso),
                Status: statusLabel(row.status),
                "Min. prijs": formatCurrency(row.minPrice),
                "Max. prijs": formatCurrency(row.maxPrice),
                Producten: row.productCount,
            })),
        );
    }, [auctionRows]);

    return (
        <div className="container-fluid py-4">
            <header className="mb-4">
                <h1 className="display-5 mb-1">Veilingmeester</h1>
                <p className="text-muted">Beheer gebruikers, veilingen en live klokken vanuit één scherm.</p>
            </header>
            {offline && <Alert variant="warning">Je bent offline. Veranderingen worden geladen zodra je weer online bent.</Alert>}
            <nav className="mb-3" role="tablist">
                <ul className="nav nav-tabs">
                    <li className="nav-item" role="presentation">
                        <button
                            type="button"
                            className={cx("nav-link", activeTab === "users" && "active")}
                            role="tab"
                            aria-selected={activeTab === "users"}
                            aria-controls="tab-gebruikers"
                            onClick={() => setActiveTab("users")}
                        >
                            Gebruikers
                        </button>
                    </li>
                    <li className="nav-item" role="presentation">
                        <button
                            type="button"
                            className={cx("nav-link", activeTab === "auctions" && "active")}
                            role="tab"
                            aria-selected={activeTab === "auctions"}
                            aria-controls="tab-veilingen"
                            onClick={() => setActiveTab("auctions")}
                        >
                            Veilingen
                        </button>
                    </li>
                </ul>
            </nav>
            <section hidden={activeTab !== "users"} id="tab-gebruikers" role="tabpanel">
                <div className="d-flex flex-wrap gap-3 align-items-end mb-3">
                    <SearchInput label="Zoek op naam of e-mail" value={userSearch ?? ""} onChange={(value) => setUserSearch?.(value)} />
                    <SelectSm<number>
                        label="Per pagina"
                        value={usersPageSize}
                        onChange={setUsersPageSize}
                        options={perPageOptions}
                        parse={(raw) => Number(raw)}
                    />
                    <button type="button" className="btn btn-outline-secondary btn-sm ms-auto" onClick={exportUsers}>
                        Exporteren als CSV
                    </button>
                </div>
            {usersError && <Alert>{usersError}</Alert>}
            {usersLoading && !userRows.length ? (
                    <Loading />
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
                                        <div className="text-muted small">{row.email || "Geen e-mail"}</div>
                                    </div>
                                ),
                                getValue: (row) => row.naam,
                            },
                            {
                                key: "email",
                                header: "E-mail",
                                sortable: true,
                                render: (row) => <span>{row.email || "—"}</span>,
                                getValue: (row) => row.email,
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
                                    <span className={cx("badge", soortBadgeClass[row.soort] ?? "text-bg-secondary")}>{row.soort}</span>
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
                        empty={<Empty message="Geen gebruikers gevonden." />}
                        getRowKey={(row) => String(row.id)}
                        onRowClick={handleUserRowClick}
                        totalResults={usersTotal}
                    />
                )}
                <div className="mt-3">
                    <Pager
                        page={usersPage}
                        pageSize={usersPageSize}
                        hasNext={usersHasNext}
                        onPrevious={() => setUsersPage((prev) => Math.max(1, prev - 1))}
                        onNext={() => setUsersPage((prev) => prev + 1)}
                        totalResults={usersTotal}
                    />
                </div>
            </section>
            <section hidden={activeTab !== "auctions"} id="tab-veilingen" role="tabpanel">
                <div className="row g-3 align-items-end mb-3">
                    <div className="col-12 col-md-3">
                        <SelectSm<number>
                            label="Per pagina"
                            value={auctionsPageSize}
                            onChange={setAuctionsPageSize}
                            options={perPageOptions}
                            parse={(raw) => Number(raw)}
                        />
                    </div>
                    <div className="col-12 col-md-3">
                        <SelectStatusSm label="Status" value={auctionsStatus ?? "alle"} onChange={(value) => setAuctionsStatus?.(value)} />
                    </div>
                    <div className="col-6 col-md-3">
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
                        />
                    </div>
                    <div className="col-6 col-md-3">
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
                        />
                    </div>
                    <div className="col-12 d-flex justify-content-end">
                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={exportAuctions}>
                            Exporteren als CSV
                        </button>
                    </div>
                </div>
                {auctionsError && <Alert>{auctionsError}</Alert>}
                {auctionsLoading && !auctionRows.length ? (
                    <Loading />
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
                                        <div className="text-muted small">
                                            {formatDateTime(row.startIso)} • {formatDateTime(row.endIso)}
                                        </div>
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
                        empty={<Empty message="Geen veilingen gevonden." />}
                        getRowKey={(row) => String(row.id)}
                        onRowClick={handleAuctionClick}
                        totalResults={auctionsTotal}
                    />
                )}
                <div className="mt-3">
                    <Pager
                        page={auctionsPage}
                        pageSize={auctionsPageSize}
                        hasNext={auctionsHasNext}
                        onPrevious={() => setAuctionsPage((prev) => Math.max(1, prev - 1))}
                        onNext={() => setAuctionsPage((prev) => prev + 1)}
                        totalResults={auctionsTotal}
                    />
                </div>
            </section>
            {selectedBidUser && (
                <BidsModal user={selectedBidUser} onClose={() => setSelectedBidUser(null)} />
            )}
            {selectedGrower && (
                <ProductsModal user={selectedGrower} onClose={() => setSelectedGrower(null)} />
            )}
            {selectedAuction && (
                <AuctionModal row={selectedAuction} onClose={() => setSelectedAuction(null)} />
            )}
        </div>
    );
}

type BidsModalProps = { user: UserRow; onClose: () => void };

function BidsModal({ user, onClose }: BidsModalProps): ReactElement {
    const { rows, loading, error, page, setPage, pageSize, setPageSize, hasNext, totalResults, from, setFrom, to, setTo } = useUserBids(
        user.id,
    );
    const invalidRange = Boolean(from && to && to < from);

    const exportBids = useCallback(() => {
        exportCsv(
            `biedingen-${user.id}.csv`,
            rows.map((row) => ({
                Nummer: row.biedNr ?? row.id,
                "Veiling nr": row.veilingNr ?? "",
                "Prijs per fust": formatCurrency(row.bedragPerFust),
                "Aantal stuks": row.aantalStuks,
                Datum: formatDateTime(row.datumIso),
                Status: statusLabel(row.status),
            })),
        );
    }, [rows, user.id]);

    return (
        <Modal title={`Biedingen gebruiker ${user.id}`} onClose={onClose}>
            <div className="row g-3 align-items-end mb-3">
                <div className="col-6 col-md-3">
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
                    />
                </div>
                <div className="col-6 col-md-3">
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
                <div className="col-12 col-md-3">
                    <SelectSm<number>
                        label="Per pagina"
                        value={pageSize}
                        onChange={setPageSize}
                        options={[10, 25, 50].map((size) => ({ value: size, label: `${size}` }))}
                        parse={(raw) => Number(raw)}
                    />
                </div>
                <div className="col-12 col-md-3 d-flex justify-content-end">
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={exportBids}>
                        Exporteren als CSV
                    </button>
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
                    getRowKey={(row) => String(row.id)}
                    totalResults={totalResults}
                />
            )}
            <div className="mt-3">
                <Pager
                    page={page}
                    pageSize={pageSize}
                    hasNext={hasNext}
                    onPrevious={() => setPage((prev) => Math.max(1, prev - 1))}
                    onNext={() => setPage((prev) => prev + 1)}
                    totalResults={totalResults}
                />
            </div>
        </Modal>
    );
}

type ProductsModalProps = { user: UserRow; onClose: () => void };

function ProductsModal({ user, onClose }: ProductsModalProps): ReactElement {
    const { rows, loading, error, page, setPage, pageSize, setPageSize, hasNext, totalResults } = useVeilingProductsByGrower(
        user.id,
    );

    const exportProducts = useCallback(() => {
        exportCsv(
            `producten-${user.id}.csv`,
            rows.map((row) => ({
                Nummer: row.veilingProductNr ?? row.id,
                Product: row.naam,
                Voorraad: row.voorraad ?? "",
                Fust: row.fust ?? "",
                "Stuks/bundel": row.piecesPerBundle ?? "",
                "Min. prijs": formatCurrency(row.minPrice),
                Status: statusLabel(row.status),
            })),
        );
    }, [rows, user.id]);

    return (
        <Modal title={`Producten van kweker ${user.id}`} onClose={onClose}>
            <div className="d-flex justify-content-end mb-3">
                <SelectSm<number>
                    label="Per pagina"
                    value={pageSize}
                    onChange={setPageSize}
                    options={[10, 25, 50].map((size) => ({ value: size, label: `${size}` }))}
                    parse={(raw) => Number(raw)}
                />
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
                                <div className="d-flex gap-2 align-items-center">
                                    {row.image && (
                                        <img
                                            src={row.image}
                                            alt={row.naam}
                                            className="img-fluid rounded border"
                                            style={{ maxWidth: 56 }}
                                        />
                                    )}
                                    <div>
                                        <div className="fw-semibold">{row.naam}</div>
                                        <div className="text-muted small">{row.categorie || "Geen categorie"}</div>
                                    </div>
                                </div>
                            ),
                            getValue: (row) => row.naam,
                        },
                        {
                            key: "voorraad",
                            header: "Voorraad (bloemen)",
                            sortable: true,
                            render: (row) => row.voorraad ?? "—",
                            getValue: (row) => row.voorraad ?? 0,
                        },
                        {
                            key: "fust",
                            header: "Fust",
                            sortable: true,
                            render: (row) => row.fust ?? "—",
                            getValue: (row) => row.fust ?? 0,
                        },
                        {
                            key: "piecesPerBundle",
                            header: "Stuks/bundel",
                            sortable: true,
                            render: (row) => row.piecesPerBundle ?? "—",
                            getValue: (row) => row.piecesPerBundle ?? 0,
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
                    getRowKey={(row) => String(row.id)}
                    totalResults={totalResults}
                />
            )}
            <div className="mt-3 d-flex justify-content-between align-items-center">
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={exportProducts}>
                    Exporteren als CSV
                </button>
                <Pager
                    page={page}
                    pageSize={pageSize}
                    hasNext={hasNext}
                    onPrevious={() => setPage((prev) => Math.max(1, prev - 1))}
                    onNext={() => setPage((prev) => prev + 1)}
                    totalResults={totalResults}
                />
            </div>
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

    useEffect(() => {
        return fetchDetail();
    }, [fetchDetail]);

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
            const startMs = currentRow.startIso ? Date.parse(currentRow.startIso) : Number.NaN;
            const endMs = currentRow.endIso ? Date.parse(currentRow.endIso) : Number.NaN;
            const price = computeClockPrice(Date.now(), startMs, endMs, currentRow.maxPrice, currentRow.minPrice);
            setCurrentPrice(price);
        };
        updatePrice();
        const timer = setInterval(updatePrice, 1000);
        return () => clearInterval(timer);
    }, [currentRow.startIso, currentRow.endIso, currentRow.maxPrice, currentRow.minPrice]);

    const { active, inactive } = useMemo(() => (detail ? splitProducts(detail) : { active: [], inactive: [] }), [detail]);

    const fileId = detailId;

    const exportProducts = useCallback(
        (products: readonly VeilingProductRow[], label: string) => {
            exportCsv(
                `veiling-${fileId}-${label}.csv`,
                products.map((product) => ({
                    Nummer: product.veilingProductNr ?? product.id,
                    Product: product.naam,
                    Voorraad: product.voorraad ?? "",
                    Fust: product.fust ?? "",
                    "Stuks/bundel": product.piecesPerBundle ?? "",
                    "Min. prijs": formatCurrency(product.minPrice),
                    Status: statusLabel(product.status),
                })),
            );
        },
        [fileId],
    );

    const progress = useMemo(() => {
        if (currentRow.maxPrice <= currentRow.minPrice) return 0;
        const ratio = (currentPrice - currentRow.minPrice) / (currentRow.maxPrice - currentRow.minPrice);
        return Math.max(0, Math.min(100, Math.round(ratio * 100)));
    }, [currentPrice, currentRow.maxPrice, currentRow.minPrice]);

    const isClockStatic = currentRow.maxPrice === currentRow.minPrice;

    return (
        <Modal title={`Veiling ${currentRow.veilingNr ?? row.id}`} onClose={onClose} size="xl">
            {error && <Alert>{error}</Alert>}
            {loading && !detail ? (
                <Loading />
            ) : (
                <div className="d-flex flex-column gap-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h3 className="h4 mb-1">{currentRow.titel}</h3>
                            <p className="text-muted mb-0">
                                {formatDateTime(currentRow.startIso)} • {formatDateTime(currentRow.endIso)}
                            </p>
                        </div>
                        <span className={cx("badge", statusBadgeVariant(currentRow.status))}>{statusLabel(currentRow.status)}</span>
                    </div>
                    <div className="card shadow-sm rounded-4 border-0">
                        <div className="card-body">
                            <p className="text-muted mb-1">Huidige klokprijs</p>
                            <div className="display-4 fw-bold" aria-live="polite">
                                {formatCurrency(currentPrice)}
                            </div>
                            <div className="text-muted">Van {formatCurrency(currentRow.maxPrice)} naar {formatCurrency(currentRow.minPrice)}</div>
                            {isClockStatic ? (
                                <div className="small text-muted mt-2">Klok staat stil</div>
                            ) : (
                                <div className="progress mt-3" aria-hidden="true">
                                    <div className="progress-bar" style={{ width: `${progress}%` }} />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="d-flex gap-2 justify-content-end">
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => exportProducts(active, "actief")}
                            disabled={!active.length}
                        >
                            Actieve producten exporteren
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => exportProducts(inactive, "inactief")}
                            disabled={!inactive.length}
                        >
                            Inactieve producten exporteren
                        </button>
                    </div>
                    <ProductSection title="Actieve producten" products={active} emptyMessage="Geen actieve producten." />
                    <ProductSection title="Inactieve producten" products={inactive} emptyMessage="Geen inactieve producten." />
                </div>
            )}
        </Modal>
    );
}

type ProductSectionProps = {
    title: string;
    products: readonly VeilingProductRow[];
    emptyMessage: string;
};

function ProductSection({ title, products, emptyMessage }: ProductSectionProps): ReactElement {
    return (
        <div className="card shadow-sm rounded-4 border-0">
            <div className="card-header bg-white border-bottom">
                <h4 className="h6 mb-0">{title}</h4>
            </div>
            <div className="card-body p-0">
                {products.length === 0 ? (
                    <div className="text-muted text-center py-4">{emptyMessage}</div>
                ) : (
                    <ul className="list-group list-group-flush">
                        {products.map((product) => (
                            <li key={product.id} className="list-group-item d-flex gap-3 align-items-center">
                                {product.image && (
                                    <img
                                        src={product.image}
                                        alt={product.naam}
                                        className="img-fluid rounded border"
                                        style={{ maxWidth: 56 }}
                                    />
                                )}
                                <div className="flex-grow-1">
                                    <div className="fw-semibold">{product.naam}</div>
                                    <div className="text-muted small">
                                        Voorraad {product.voorraad ?? "—"} • Fust {product.fust ?? "—"}
                                    </div>
                                    <div className="text-muted small">
                                        Stuks/bundel {product.piecesPerBundle ?? "—"} • Min. prijs {formatCurrency(product.minPrice)}
                                    </div>
                                </div>
                                <span className={cx("badge", statusBadgeVariant(product.status))}>{statusLabel(product.status)}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

