# Changelog – Veilingmeester Refactor

## Added
- `components/` – shared Bootstrap UI primitives (alerts, selects, pagination, badges, placeholders).
- `config/index.ts` – centralised runtime configuration and environment parsing.
- `features/auctions/` – auctions tab + modal decomposition with live updates.
- `features/products/ProductsModal.tsx` – dedicated kweker product modal.
- `features/users/` – gebruikers tab and koper modalisation.
- `utils/` – formatting helpers, className combiner, offline hook.
- `__tests__/DataTable.test.tsx` – accessibility + sorting coverage for table component.
- `__tests__/api.test.ts` – contract test for paginated API client.
- `README-veilingmeester-CHANGES.md` – refactor documentation and testing guidance.
- `CHANGELOG-veilingmeester.md` – this file.

## Modified
- `Veilingmeester.tsx` – converted to lazy-loaded feature shell with accessible tabbed navigation and modal orchestration.
- `DataTable.tsx` – enhanced sorting semantics, sticky headers via Bootstrap utilities, memoisation, and TSDoc.
- `Modal.tsx` – improved accessibility, sticky header/footer via utilities, and documentation.
- `api.ts` – now honours typed configuration and request timeouts without magic numbers.
- `hooks.ts` – aligned polling/storage settings with config, added TSDoc, preserved abortable refresh.
- `live.ts` – leverages configured realtime poll steps.

## Removed
- `components.tsx` – superseded by modular `components/` primitives.
