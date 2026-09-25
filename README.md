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
   manifest, independently derive the observed scope, and reach a verdict through consensus.

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
| StudioNet | `0xb75215a19AD9d4d46845CB4686c664E16af13199` | [View](https://explorer-studio.genlayer.com/address/0xb75215a19AD9d4d46845CB4686c664E16af13199) |

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
pip install "genlayer-test==0.29.2"
pytest tests -q -p no:cacheprovider
```

Full deployment instructions: [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)

<br />

---

## Project structure

```
contracts/scopeseal.py    The GenVM contract
frontend/                  React + Vite app
docs/                       ARCHITECTURE.md, DEPLOYMENT.md, FRONTEND.md, CONTRACTS.md
tests/                       direct-mode test suite (29 tests)
LICENSE                      MIT
```

<br />

---

## Status

<div align="center">

![Tested](https://img.shields.io/badge/contract%20logic-tested-brightgreen?style=flat-square)
![Live](https://img.shields.io/badge/live%20StudioNet-verified-brightgreen?style=flat-square)

</div>

All 29 direct-mode tests pass against the real contract under `genlayer-test==0.29.2`, and
`genvm-lint check` passes clean. Beyond that, all three verdict paths (`COMPLIANT`,
`SCOPE_VIOLATION`, `INCONCLUSIVE`) have been run live against the deployed contract on StudioNet,
through the real app, with real GenVM validator consensus and a real npm registry fetch — not
mocked. See [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) for the transaction links and the full,
itemized breakdown of what is and isn't proven.

<br />

---

<div align="center">

Built on [GenLayer](https://genlayer.com) · [Portal submission](https://portal.genlayer.foundation/)

</div>
