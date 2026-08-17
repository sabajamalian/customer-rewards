# Copilot instructions for customer-rewards

You are working in a TypeScript monorepo for a retail customer loyalty and rewards platform.
Read `README.md` first for the architecture and the domain glossary. These instructions add the
conventions that are not obvious from reading the code.

## Repository layout

- `server/` — Express API, ESM, strict TypeScript. Business logic lives in `src/services/`,
  HTTP wiring in `src/routes/`, shared types in `src/types/`, data access behind the
  `RewardsStore` interface in `src/data/store.ts`.
- `web/` — React 18 + Vite frontend. Route level components in `src/pages/`, reusable
  presentational components in `src/components/`, the typed fetch wrapper in `src/api/client.ts`.

## Rules that matter

1. **Layering.** Services contain business rules and never import from `express`. Routes contain
   no business rules: they parse input, call a service, map errors to status codes, and return
   JSON. New behavior belongs in a service with its own unit tests.
2. **Data access.** Never read or mutate seed arrays directly. Go through the `RewardsStore`
   interface. If a new capability needs a new store method, add it to the interface and implement
   it in `InMemoryRewardsStore`.
3. **Types.** Shared domain shapes live in `server/src/types/index.ts`. Do not redeclare them
   inline. When the API response shape changes, update the mirrored types in
   `web/src/api/client.ts` in the same change.
4. **ESM imports.** The server is ESM with `moduleResolution: bundler` but relative imports still
   carry the `.js` extension (`import { store } from './data/store.js'`). Match the existing
   style. Use `import type` for type only imports; the lint rule enforces it.
5. **Strictness.** `strict` and `noUncheckedIndexedAccess` are on. Indexing an array yields
   `T | undefined`. Handle it rather than reaching for `any` or a non-null assertion in
   production code. Non-null assertions are acceptable in tests.
6. **Points arithmetic.** Points are integers. Any calculation that produces a fraction is
   rounded down with `Math.floor`. Lifetime points only ever increase; the spendable balance is
   derived by summing transactions, never stored on the member.
7. **Errors.** Throw a named error class from a service (see `MemberNotFoundError`,
   `InvalidPurchaseError`) and translate it in the route. Do not throw bare strings and do not
   return an HTTP status from a service.

## Testing

- Vitest. Tests live in `server/src/__tests__/` and are named `<subject>.test.ts`.
- Unit test services directly with a fresh store from `createStore(referenceDate)`.
- Integration test HTTP behavior with `supertest` against `createApp(store)`.
- Always pass an explicit reference date when creating a store in a test so seeded data is
  deterministic. The existing tests use `new Date('2026-08-16T00:00:00.000Z')`.
- Every new endpoint needs at least a happy path test and a failure path test.
- Every new business rule needs a unit test covering its boundary conditions.

## Frontend

- Function components with hooks. No class components.
- Fetch through `api` in `src/api/client.ts`. Do not call `fetch` from a component.
- Handle loading and error states explicitly; every page already does.
- Style with the existing CSS classes and custom properties in `src/styles.css`. Do not add a
  CSS framework or a styling library.

## Before you open a pull request

Run and pass all four:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Keep the change focused on the work item. Do not reformat unrelated files, do not upgrade
dependencies, and do not add new dependencies unless the work genuinely requires one. Update
`README.md` when you add or change an API endpoint.
