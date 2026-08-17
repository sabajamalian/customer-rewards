# Customer Rewards

A customer loyalty and rewards platform for a retail and consumer goods brand. Members earn
points on qualifying purchases, move through tiers, and redeem points against a reward catalog.

This is a TypeScript monorepo: an Express API and a React single page app, wired together with
npm workspaces.

## Architecture

```
customer-rewards/
├── server/                 Express API (TypeScript, ESM)
│   └── src/
│       ├── data/           Seed data and the in-memory store
│       ├── routes/         HTTP routing, one router per resource
│       ├── services/       Business logic, no HTTP concerns
│       ├── types/          Shared domain types
│       ├── __tests__/      Vitest unit and integration tests
│       ├── app.ts          Express app factory
│       └── index.ts        Server entrypoint
└── web/                    React + Vite frontend
    └── src/
        ├── api/            Typed API client
        ├── components/     Reusable presentational components
        └── pages/          Route level components
```

The data layer sits behind the `RewardsStore` interface in `server/src/data/store.ts`. The
current implementation keeps everything in memory and reseeds on boot with deterministic data,
so the app runs with no database and no native dependencies. Swapping in a real database means
implementing that one interface.

Services never touch Express types. Routes never contain business rules. Keep that separation.

## Domain glossary

| Term | Meaning |
| --- | --- |
| **Member** | An enrolled customer in the loyalty program. |
| **Lifetime points** | Total points ever earned. Drives tier placement. Never decreases. |
| **Points balance** | Spendable points: the sum of all transactions, earns positive, redemptions negative. |
| **Tier** | Bronze, Silver, Gold, or Platinum. Determined by lifetime points crossing a threshold. |
| **Multiplier** | Per tier earn rate applied to the base one point per dollar. |
| **Transaction** | A points movement: `earn`, `redeem`, or `adjust`. |
| **Reward** | A catalog item that can be exchanged for points. Has a points cost and stock. |
| **Redemption** | The record of a member exchanging points for a reward. |

Tier thresholds are lifetime points: Bronze 0, Silver 2,500, Gold 10,000, Platinum 25,000.
Multipliers are 1x, 1.25x, 1.5x, and 2x. Earned points are always rounded down.

## Running locally

Requires Node 20 or newer.

```bash
npm install
npm run dev
```

That starts the API on `http://localhost:4000` and the frontend on `http://localhost:5173`.
Vite proxies `/api` to the server, so the frontend needs no extra configuration.

Run the individual workspaces if you prefer:

```bash
npm run dev --workspace server
npm run dev --workspace web
```

## Checks

```bash
npm run lint        # ESLint across both workspaces
npm run typecheck   # tsc --noEmit
npm run test        # Vitest
npm run build       # tsc build for server, vite build for web
```

CI runs all four on every pull request. A change is not done until they all pass.

## API

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness check. |
| `GET` | `/api/members` | All members with tier, balance, and progress to next tier. |
| `GET` | `/api/members/:id` | A single member summary. |
| `GET` | `/api/members/:id/transactions` | Transaction history, newest first. |
| `POST` | `/api/members/:id/earn` | Record a qualifying purchase and award points. |
| `GET` | `/api/rewards` | Active reward catalog. Pass `?includeInactive=true` to see everything. |
| `GET` | `/api/rewards/:id` | A single reward. |
| `GET` | `/api/tiers` | Tier definitions, thresholds, and multipliers. |

Example:

```bash
curl -X POST http://localhost:4000/api/members/mbr-1001/earn \
  -H 'content-type: application/json' \
  -d '{"amountSpent": 84.50, "source": "pos:store-114", "description": "Weekly grocery run"}'
```

## Roadmap

Tracked in Azure Boards. The near term backlog includes points expiration, reward redemption,
and member search and filtering.
