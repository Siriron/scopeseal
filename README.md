<div align="center">

<img src="./frontend/public/favicon.svg" width="88" alt="ScopeSeal logo" />

# ScopeSeal

### A package's declared publish scope, checked against what it actually shipped.

<br />

![Status](https://img.shields.io/badge/status-building-yellow?style=flat-square)
![Networks](https://img.shields.io/badge/network-StudioNet-blue?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20GenVM-8B3A2F?style=flat-square)

<br />

**[Documentation](./docs/ARCHITECTURE.md)** &nbsp;·&nbsp; **[Smart Contract](./contracts/scopeseal.py)**

</div>

<br />

---

## What this is

A maintainer sets a permanent ceiling on what any release of their npm package is allowed to do —
whether install-time lifecycle scripts are permitted, a maximum dependency count, whether platform
restrictions are allowed. Before publishing one specific version, they lock a declaration of
exactly what that version will do, within the ceiling. GenLayer validators then independently
fetch the real, live registry manifest for that version and confirm whether it actually stayed
within what was declared — never taking the maintainer's word for it.

<br />

<div align="center">

| | |
|---|---|
| **Concept** | On-chain npm publish-scope compliance attestation |
| **Consensus need** | A maintainer (or a compromised publish credential) benefits from a false COMPLIANT verdict on a release that quietly adds an undeclared install script or blows past a dependency ceiling — a classic supply-chain attack shape |
| **Evidence source** | `registry.npmjs.org/{name}/{version}` — the real, public, unauthenticated, immutable per-version manifest, never the maintainer's own description of it |
| **Network** | StudioNet |

</div>

<br />

---

## How it works

1. A maintainer calls `register_profile` once per package, setting the ceiling.
2. Before publishing a version, they call `declare_release`, locking that version's declared scope
   — rejected on-chain if it exceeds the ceiling on any field.
3. Once the version is live on npm, anyone calls `check_compliance`. Validators fetch the real
   manifest and independently derive the observed facts. The contract then derives the verdict
   (`COMPLIANT` or `SCOPE_VIOLATION`) from those facts in plain code; the LLM only writes the
   explanation, and a validator rejects any result whose verdict conflicts with the facts.

<br />

<details>
<summary><b>The three-way verdict</b></summary>
<br />

- **COMPLIANT** — the observed manifest stayed within both the declared scope and the profile
  ceiling.
- **SCOPE_VIOLATION** — the observed manifest exceeded the declared scope or the ceiling (an
  undeclared lifecycle script, more dependencies than declared, an unpermitted platform
  restriction).
- **INCONCLUSIVE** — the declared version isn't published yet, the registry fetch failed, or the
  fetched record's own name/version didn't match the declaration. This is the honest outcome when
  evidence can't speak to the claim, not a forced guess.

</details>

<br />

---

## Deployed contracts

<div align="center">

| Network | Address | Explorer |
|---|---|---|
| StudioNet | `0x23045738dB42801d5ABEb9fcc288Bc4caBb11EE7` | [View](https://explorer-studio.genlayer.com/address/0x23045738dB42801d5ABEb9fcc288Bc4caBb11EE7) |

</div>

<br />

---

## Quick start

```bash
cd frontend
npm ci --no-audit --no-fund
npm run dev
```

Run the contract tests (they execute the real contract under the GenVM SDK in direct mode):

```bash
pip install -r requirements-dev.txt     # genlayer-test==0.29.2, genvm-linter==0.11.0
genvm-lint check contracts/scopeseal.py
pytest tests -q -p no:cacheprovider
```

Frontend checks (also run by `.github/workflows/ci.yml`):

```bash
cd frontend
npm ci --no-audit --no-fund
npm run typecheck && npm run lint && npm test && npm run build
```

Full deployment instructions: [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)

<br />

---

## Project structure

```
contracts/scopeseal.py    The GenVM contract
frontend/                  React + Vite app
docs/                       ARCHITECTURE.md, DEPLOYMENT.md, FRONTEND.md, CONTRACTS.md
tests/                       direct-mode contract tests (81)
frontend/src/lib/tx.test.ts  frontend transaction-outcome tests (47)
.github/workflows/ci.yml     npm ci, typecheck, lint, test, build, genvm-lint, pytest
LICENSE                      MIT
```

<br />

---

## Status

<div align="center">

![Tested](https://img.shields.io/badge/contract%20logic-tested-brightgreen?style=flat-square)
![Live](https://img.shields.io/badge/StudioNet%20verdict%20paths-verified-brightgreen?style=flat-square)

</div>

The contract was changed after steward review (verdict derived in code, one owner-only declaration
per version, persisted declaration ids). Against the changed contract: `genvm-lint check` passes,
all 81 direct-mode tests pass under `genlayer-test==0.29.2`, and the frontend passes `npm ci`,
`typecheck`, `lint`, 47 unit tests and `build`.

The changed contract is deployed on StudioNet at `0x23045738dB42801d5ABEb9fcc288Bc4caBb11EE7`.
On Oct 3, 2026 all three verdicts (COMPLIANT, SCOPE_VIOLATION, INCONCLUSIVE) were run against it
with real validator consensus and a real npm fetch; the transactions are in
[`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md). Not yet run live against it: the revert cases, the
persisted-id views, and the deployed frontend flow.

<br />

---

<div align="center">

Built on [GenLayer](https://genlayer.com) · [Portal submission](https://portal.genlayer.foundation/)

</div>
