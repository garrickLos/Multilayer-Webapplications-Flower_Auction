# Veilingmeester React Refactor Summary

## Structural changes and rationale
- Replaced the monolithic `Veilingmeester.tsx` with feature-specific components and lazy-loaded modals (`features/`), improving readability, bundle size, and separation of concerns.
- Introduced shared UI primitives in `components/` (select fields, alerts, placeholders, pagination, badges) to enforce consistent Bootstrap-only styling and remove custom CSS.
- Centralised configuration (endpoints, pagination options, polling intervals, thumbnail sizing) in `config/index.ts`, enabling environment overrides and eliminating magic numbers.
- Added utility helpers for formatting (`utils/formatting.ts`), class composition, and offline detection to keep feature code declarative.
- Refreshed API + hooks layer to depend on typed configuration, maintain abortable polling, and expose strongly typed hook contracts with TSDoc documentation.

## Bootstrap utility usage & MDB-inspired patterns
- Layout rebuilt with Bootstrap grid, cards, nav tabs, badges, and rounded/shadow utilities to emulate MDB elevation without custom styling.
- Skeletons use `placeholder-glow`, spacing (`gap-*`, `py-*`), and dark-mode friendly classes instead of bespoke CSS.
- Tables rely on `table-responsive`, `position-sticky`, and badge utilities; progress indicators follow Bootstrap `progress` semantics.
- Modals, alerts, and badges exclusively leverage Bootstrap components, ensuring accessible focus management and consistent visual hierarchy.

## Running tests
```bash
# From the react/ directory
npm test -- --runTestsByPath src/veilingmeester/__tests__/DataTable.test.tsx src/veilingmeester/__tests__/api.test.ts
```
> **Note:** The project currently lacks an `npm test` script; add one (e.g., invoking Jest) before executing the command above.

## Known limitations & follow-ups
- Global project configuration is still missing a Jest runner script; add and document the standard test workflow.
- Live veiling updates rely on server-provided EventSource/WebSocket endpoints that are not available in the local test harness; manual verification is recommended.
- Additional accessibility testing (e.g., screen reader verification) is advisable after integrating with the production data set.
