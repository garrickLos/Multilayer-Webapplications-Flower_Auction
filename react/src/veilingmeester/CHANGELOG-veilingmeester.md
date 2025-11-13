# Changelog – Veilingmeester Dashboard

## [Unreleased]
### Added
- `features/dashboard/` met `DashboardMetrics`-component en `useDashboardMetrics`-hook voor KPI-kaarten en automatische refresh.
- `components/ErrorBoundary` voor veilige render-fallbacks en resetfunctionaliteit.
- Documentatiebestanden `README-veilingmeester-CHANGES.md` en `CHANGELOG-veilingmeester.md`.
- Nieuwe Jest-test `__tests__/dashboard.test.tsx` ter validatie van de dashboardhook.

### Changed
- `Veilingmeester.tsx` herbouwd tot een modern dashboard met navbar, hero, KPI-kaarten, tabknoppen en ErrorBoundaries.
- `DataTable`, `Pager`, `Feedback`, `SelectField`, `SearchField`, `FilterChip`, `ResultBadge` en `Modal` kregen lichtgroene Bootstrap-styling en verbeterde toegankelijkheid.
- `features/users/*`, `features/auctions/*` en `features/products/*` kregen kaartgebaseerde filters, chips en success-accenten.
- `config/index.ts` uitgebreid met dashboardconfiguratie (samplegrootte & refresh-interval).

### Fixed
- Consistente fout-/leegstates binnen tabellen en modals dankzij gedeelde componenten en accentkleuren.
