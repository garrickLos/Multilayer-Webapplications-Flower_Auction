# Veilingmeester front-end

## Structuur
```
front-end/react/src/veilingmeester/
├── VeilingmeesterPage.tsx           # Pagina/container (tab-navigatie, data, acties)
├── api.ts                           # API calls
├── components/                      # UI componenten
│   ├── AuctionsTab.tsx              # Zoek/filter + veilingen tabel + acties
│   ├── DashboardMetrics.tsx         # Bovenste KPI-kaarten
│   ├── LinkProductsModal.tsx        # Koppelen/ontkoppelen producten
│   ├── NewAuctionModal.tsx          # Nieuwe veiling modal
│   ├── ProductsTab.tsx              # Producten tabel + filters
│   ├── UserBidsModal.tsx            # Biedingen modal
│   ├── UserProductsModal.tsx        # Producten per gebruiker modal
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
- **Search bar (veilingen)** → `components/AuctionsTab.tsx`
- **Filters (veilingen/producten/gebruikers)** → `components/AuctionsTab.tsx`, `components/ProductsTab.tsx`, `components/UsersTab.tsx`
- **Labels/teksten** → betreffende component (`components/*.tsx`) of `components/ui.tsx` voor badges
- **Veiling acties (aanmaken/annuleren)** → `VeilingmeesterPage.tsx` (`handleCreateAuction`, `handleCancelAuction`)
- **Link/unlink producten** → `components/LinkProductsModal.tsx` (UI) + `VeilingmeesterPage.tsx` (handlers)
- **Refresh gedrag** → `hooks.ts` (`useVeilingmeesterData.refreshAll`) + `VeilingmeesterPage.tsx` (button)

## Auto-refresh na acties
Na acties (aanmaken veiling, annuleren veiling, koppelen/ontkoppelen product) wordt de lokale state direct bijgewerkt in `VeilingmeesterPage.tsx`.
Omdat alle tabbladen dezelfde state gebruiken, zie je de wijzigingen direct zonder pagina-refresh.

## Handmatige Refresh knop
De knop **Ververs** in de navbar roept `refreshAll` aan in `hooks.ts`.
Die herlaadt veilingen, producten, gebruikers en biedingen vanuit de API.
