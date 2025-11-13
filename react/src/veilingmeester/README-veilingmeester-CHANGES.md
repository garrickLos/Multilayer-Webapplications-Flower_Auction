# Veilingmeester Dashboard Refresh

## Overzicht
- Het volledige beheerscherm is omgevormd tot een kaart-gebaseerd dashboard met Bootstrap 5 utilities en een lichtgroene accentkleur.
- Gebruikers-, veilingen- en productflows delen dezelfde componentbibliotheek (tabnavigatie, tabellen, modals, KPI-kaarten, alerts en chips).
- Nieuwe `DashboardMetrics`-feature levert realtime KPI's inclusief automatische verversing, voortgangsindicatoren en error handling.
- Alle interactieve secties zijn afgeschermd door een herbruikbare `ErrorBoundary` en tonen consistente laad-, leeg- en foutstatussen.

## Visuele & UX-strategie
- Alleen Bootstrap 5-componenten/utilities: kaarten, knoppen, alerts, badges, progress bars, navbars, modals en grids. Geen custom CSS.
- Lichtgroene accenten via `bg-success-subtle`, `text-success(-emphasis)` en `btn-success` voor primaire acties.
- Centrale hero, KPI-kaarten en tabkeuze zorgen voor een duidelijke hiërarchie en centreren de belangrijkste informatie.
- Filters, chips en paginatie zijn card-based met afgeronde hoeken en schaduwen voor rustige white space.

## Architectuur & Codekwaliteit
- Nieuwe featuremap `features/dashboard` bevat `DashboardMetrics` en `useDashboardMetrics` met strikte TypeScript-typing.
- Alle publieke componenten/haken hebben TSDoc-commentaar en gebruiken moderne React hooks/memoization.
- `ErrorBoundary` en `DashboardMetrics` consolideren foutafhandeling, while `appConfig` werd uitgebreid met dashboardinstellingen (samplegrootte & refresh-interval).
- Data-tabellen en modals gebruiken uitsluitend Bootstrap utilities voor kleur, spacing en interactie.

## Toegankelijkheid & Responsiviteit
- Tabnavigatie en tabellen gebruiken ARIA-attributen (`role="tablist"`, `aria-sort`, `aria-live`).
- Alle filters en inputs hebben labels met hoog contrast. Buttons blijven focusbaar en toetsenbordvriendelijk.
- Layouts gebruiken responsieve grids (`row`/`col`) en flex utilities zodat de dashboardkaarten centreren op kleine en grote schermen.

## Uitvoeren & Testen
1. Installeer afhankelijkheden binnen `react/` (éénmalig): `npm install`.
2. Ontwikkelserver: `npm run dev` (Vite).
3. Productiebouw: `npm run build`.
4. Tests: voeg lokaal een `test`-script toe dat Jest/Vitest start en voer daarna `npm test -- --runTestsByPath src/veilingmeester/__tests__/*.test.tsx` uit. Door het ontbreken van een testscript in `package.json` moet dit nog worden geconfigureerd binnen het project.

## Uitbreiden
- Voeg extra KPI-kaarten toe door `useDashboardMetrics` uit te breiden met extra API-calls; elke kaart volgt het `MetricCard`-type.
- Nieuwe tabellen kunnen `DataTable` gebruiken; kolomdefinities blijven type-safe en sorteerbaar.
- Gebruik `FilterChip` en `InlineAlert` voor consistente filterfeedback en foutmeldingen.

## Follow-up Work
- Configureer een Jest/Vitest-testscript in `react/package.json` zodat de bestaande tests automatisch draaien in CI.
- Overweeg een echte API-endpoint voor geaggregeerde metrics om dubbele requests te beperken.
- Voeg Bootstrap Icons toe aan het project voor nog rijkere visuele feedback zodra dependencies buiten deze map aangepast mogen worden.
