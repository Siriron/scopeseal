# Frontend

React + Vite + TypeScript + Tailwind. No Next.js, no server-side code — a static SPA that talks
directly to GenLayer StudioNet via `genlayer-js`.

## Structure

- `src/config/chains.ts` — the single plain constant for the deployed contract address, plus the
  StudioNet chain config. This is the only place either value lives; update this one file after a
  redeploy.
- `src/lib/client.ts` — `ensureChain()`, read/write client construction, and a `TimeoutError` class
  carrying the transaction hash so a slow-to-finalize write can still point the person at the
  explorer instead of just failing silently.
- `src/lib/contracts.ts` — one function per contract method, each parsing the JSON string every
  view returns.
- `src/lib/WalletContext.tsx` — wallet connection state, persisted across reloads via a silent
  `eth_accounts` check on mount, and kept in sync via the `accountsChanged` listener.
- `src/components/` — `Header`, `Hero`, `Workspace` (the tabbed Register / Declare / Check / Look
  up panels), `Footer`, `Docs`, `NotFound`, `ErrorBoundary`.

## Local development

```bash
cd frontend
npm ci --no-audit --no-fund
npm run dev
```

## Verification run for this build

```
npm run typecheck   → passed, zero errors
npm run build        → passed, dist/ produced
```

`npm run lint` requires the full eslint dependency tree already installed via `npm ci`; run it
locally before any resubmission if the dependency set changes.
