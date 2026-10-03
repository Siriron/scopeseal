# Frontend

React + Vite + TypeScript + Tailwind. No Next.js, no server-side code — a static SPA that talks
directly to GenLayer StudioNet via `genlayer-js`.

## Structure

- `src/config/chains.ts` — the single plain constant for the deployed contract address, plus the
  StudioNet chain config. This is the only place either value lives; update this one file after a
  redeploy.
- `src/lib/client.ts` — `ensureChain()`, read/write client construction, and transaction outcome
  classification. `TxFailure` has four kinds: `wallet_rejected` (user refused the signature),
  `reverted` (the contract errored; no state changed), `consensus_rejected` (validators
  undetermined, cancelled or disagreed), `timed_out` (polling gave up or validators timed out; the
  transaction may still complete, and the hash is kept). A transaction that is accepted and did not
  error is the only success.
- `src/lib/contracts.ts` — one function per contract method, each parsing the JSON string every
  view returns. `declareRelease` reads the new declaration id back from `get_declaration_id`
  (package + version) and verifies owner and scope; `checkCompliance` takes the declaration the
  person was shown, re-reads it after acceptance and fails if it is not the same package@version
  or is not checked.
- `src/lib/WalletContext.tsx` — wallet connection state, persisted across reloads via a silent
  `eth_accounts` check on mount, and kept in sync via the `accountsChanged` listener.
- `src/components/CheckPanel.tsx` — the check form is bound to a declaration: the person enters (or
  arrives with) package + version, the panel loads the declaration, shows `package@version`, its
  id and declared scope, and the button reads "run compliance check for <package@version>".
  `DeclarePanel` hands the new declaration to it directly.
- `src/components/TxFailureNotice.tsx` — one notice for all four failure kinds, with the
  transaction link and a "re-read on-chain state" action.
- `src/components/` — `Header`, `Hero`, `Workspace` (the tabbed Register / Declare / Check / Look
  up panels), `Footer`, `Docs`, `NotFound`, `ErrorBoundary`.

## Local development

```bash
cd frontend
npm ci --no-audit --no-fund
npm run dev
```

## Verification

```bash
cd frontend
npm ci --no-audit --no-fund
npm run typecheck
npm run lint
npm test          # 47 vitest tests: outcome classification, declare/check flows, validation
npm run build
```

All five pass from a clean `npm ci`. The unit tests fake the wallet and RPC layer and run the real
`client.ts` / `contracts.ts` code. They do not exercise a browser, a real wallet, or a live
network; those were not re-run after the review changes.
