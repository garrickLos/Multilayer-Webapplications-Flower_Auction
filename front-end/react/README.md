# Front-end (React)

Deze map bevat de React + Vite client voor de bloemenveiling-applicatie. De applicatie is geschreven in TypeScript en bestaat uit pagina’s en herbruikbare componenten. Deze README geeft een volledige uitleg van de structuur, configuratie en typische workflows.

## Inhoud

- [Vereisten](#vereisten)
- [Installatie](#installatie)
- [Ontwikkelen](#ontwikkelen)
- [Build (productie)](#build-productie)
- [Preview (lokale productiebuild)](#preview-lokale-productiebuild)
- [Configuratie (environment variables)](#configuratie-environment-variables)
- [Projectstructuur en uitleg](#projectstructuur-en-uitleg)
- [Belangrijke bestanden](#belangrijke-bestanden)
- [Scripts](#scripts)
- [Routing](#routing)
- [Koppeling met de backend](#koppeling-met-de-backend)
- [Statische assets en afbeeldingen](#statische-assets-en-afbeeldingen)
- [Linting & kwaliteit](#linting--kwaliteit)
- [Veelvoorkomende problemen](#veelvoorkomende-problemen)
- [Contributie](#contributie)

## Vereisten

- Node.js 18+ (of de versie die in jullie tooling is afgesproken)
- npm (meegeleverd met Node.js)

## Installatie

Installeer de dependencies vanuit deze map (`front-end/react`):

```bash
npm install
```

## Ontwikkelen

Start de ontwikkelserver met Hot Module Reloading (HMR):

```bash
npm run dev
```

De dev server draait standaard op `http://localhost:5173`.

## Build (productie)

Maak een productiebuild:

```bash
npm run build
```

De build-output staat in de map `dist/`.

## Preview (lokale productiebuild)

Gebruik de preview-server om de productiebuild lokaal te bekijken:

```bash
npm run preview
```

## Configuratie (environment variables)

Maak eventueel een `.env` bestand aan in `front-end/react`:

- `VITE_API_URL` — basis-URL van de backend API
- `VITE_IMAGE_URL` — basis-URL voor afbeelding-assets

Voorbeeld:

```bash
VITE_API_URL=http://localhost:5000
VITE_IMAGE_URL=http://localhost:5000/images
```

> Let op: Vite leest alleen variabelen met de prefix `VITE_`.

## Projectstructuur en uitleg

- `src/` — alle applicatiecode.
  - `components/` — herbruikbare UI componenten (knoppen, cards, modals, etc.).
  - `pages/` — pagina’s die via routing bereikbaar zijn.
  - `hooks/` — custom React hooks.
  - `services/` of `api/` — logica voor API-calls (als aanwezig).
  - `assets/` — lokaal gebundelde afbeeldingen en styling assets.
- `public/` — statische bestanden die ongewijzigd naar de build gaan.
- `dist/` — output van `npm run build` (wordt gegenereerd).

## Belangrijke bestanden

- `index.html` — Vite entrypoint voor de app.
- `vite.config.ts` — bundlerconfiguratie en build-instellingen.
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` — TypeScript configuraties.
- `eslint.config.js` — lintregels (indien gebruikt).

## Scripts

Veelgebruikte npm scripts (zie `package.json` voor het volledige overzicht):

- `npm run dev` — start de dev server
- `npm run build` — maak een productiebuild
- `npm run preview` — preview de productiebuild lokaal
- `npm run lint` — run linting (als deze is ingesteld)

## Routing

Single Page Application routing is ingesteld via `public/_redirects`. Bij het bouwen wordt dit bestand naar `dist/_redirects` gekopieerd zodat alle routes naar `index.html` herschreven worden.

## Koppeling met de backend

- Zet `VITE_API_URL` naar de basis-URL van de API, bijvoorbeeld `http://localhost:5000`.
- Zorg dat de backend draait voordat je de front-end start.
- Controleer CORS-configuratie in de backend als requests worden geblokkeerd.
- Voor afbeeldingen of downloads: gebruik `VITE_IMAGE_URL` als centrale basis-URL.

## Statische assets en afbeeldingen

- Bestanden in `public/` zijn direct benaderbaar (bijv. `/logo.png`).
- Bestanden in `src/assets/` worden door Vite gebundeld; importeer ze in je code.

## Linting & kwaliteit

Als linting is ingeschakeld, kun je dit draaien met:

```bash
npm run lint
```

Gebruik consistente componentstructuren en herbruik zoveel mogelijk bestaande UI-elementen.

## Veelvoorkomende problemen

- **API niet bereikbaar**: controleer of `VITE_API_URL` correct is en of de backend draait.
- **Verkeerde routes na refresh**: zorg dat `public/_redirects` aanwezig is en correct wordt meegebouwd.
- **Verouderde dependencies**: draai `npm install` opnieuw na het wisselen van branch.
- **CORS errors**: kijk naar de CORS-configuratie in de backend.

## Contributie

- Houd code consistent en gebruik bestaande componenten waar mogelijk.
- Voeg nieuwe pagina’s toe onder `src/pages` en koppel routes via de router.
- Test veranderingen lokaal met `npm run dev` of `npm run preview`.
