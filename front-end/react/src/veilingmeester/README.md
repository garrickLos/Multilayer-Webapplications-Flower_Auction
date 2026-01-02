# Veilingmeester front-end

## Structuur
```
front-end/react/src/veilingmeester/
├── VeilingmeesterPage.tsx           # Pagina/container (tab-navigatie, data, acties)
├── auctionActions.ts               # Veiling acties (aanmaken/annuleren/koppelen)
├── api.ts                           # API calls
├── components/                      # UI componenten
│   ├── AuctionsTab.tsx              # Zoek/filter + veilingen tabel + acties
│   ├── AuctionsFilters.tsx          # Zoek/filter UI + refresh voor veilingen
│   ├── DashboardMetrics.tsx         # Bovenste KPI-kaarten
│   ├── LinkProductsModal.tsx        # Koppelen/ontkoppelen producten
│   ├── NewAuctionModal.tsx          # Nieuwe veiling modal
│   ├── ProductCard.tsx              # Product cards/thumbnail UI
│   ├── ProductLinking.tsx           # Gekoppelde producten UI helpers
│   ├── ProductsFilters.tsx          # Filters + refresh voor producten
│   ├── ProductsTab.tsx              # Producten tabel + filters
│   ├── UserDetailCards.tsx          # Cards voor biedingen/producten in modals
│   ├── UserBidsModal.tsx            # Biedingen modal
│   ├── UserProductsModal.tsx        # Producten per gebruiker modal
│   ├── UsersFilters.tsx             # Filters + refresh voor gebruikers
│   ├── UsersTab.tsx                 # Gebruikers tabel + filters
│   ├── Modal.tsx                    # Basis modal
│   ├── Table.tsx                    # Tabel + paginatie
│   └── ui.tsx                       # Kleine UI helpers (Input, Select, StatusBadge, ...)
├── helpers.ts                       # Pure helpers (formatting, filters, parsing)
├── hooks.ts                         # Data hooks + view state hooks
├── rules.ts                         # Business rules (status mapping, filters)
└── types.ts                         # Lokale types (payloads/form state)
```

## Waar wijzig ik X?
- **Search bar (veilingen)** → `components/AuctionsFilters.tsx`
- **Filters (veilingen/producten/gebruikers)** → `components/AuctionsFilters.tsx`, `components/ProductsFilters.tsx`, `components/UsersFilters.tsx`
- **Labels/teksten** → betreffende component (`components/*.tsx`) of `components/ui.tsx` voor badges
- **Veiling acties (aanmaken/annuleren)** → `auctionActions.ts` (`useAuctionActions`)
- **Link/unlink producten** → `components/ProductLinking.tsx` (UI) + `auctionActions.ts` (handlers)
- **Refresh gedrag** → `hooks.ts` (`refreshAuctions`, `refreshProducts`, `refreshUsers`) + `components/*Filters.tsx` (buttons)
- **Linked producten display** → `components/ProductLinking.tsx` + `components/ProductCard.tsx`
- **Annuleer statusregels** → `auctionActions.ts` (status update) + `components/AuctionsTab.tsx` (button disable)
- **Producten tabel foto** → `components/ProductsTab.tsx` + `components/ProductCard.tsx`
- **Gebruikers modals layout** → `components/UserDetailCards.tsx`

## Auto-refresh na acties
Na acties (aanmaken veiling, annuleren veiling, koppelen/ontkoppelen product) wordt de lokale state direct bijgewerkt in `auctionActions.ts`.
Omdat alle tabbladen dezelfde state gebruiken, zie je de wijzigingen direct zonder pagina-refresh.

## Handmatige Refresh knoppen
Elke tab heeft een eigen **Ververs**-knop in de filters (zie `components/*Filters.tsx`).
Die knoppen roepen per tab `refreshAuctions`, `refreshProducts` of `refreshUsers` aan in `hooks.ts`.
`refreshUsers` haalt ook biedingen op zodat de gebruikersmodals actueel blijven.
