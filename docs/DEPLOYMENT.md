# Deployment

## Network

GenLayer StudioNet exclusively.

| | StudioNet |
|---|---|
| Chain ID | 61999 (0xF22F) |
| RPC | https://studio.genlayer.com/api |
| Explorer | https://explorer-studio.genlayer.com |

## Current deployment

Deployed on GenLayer StudioNet: `0x23045738dB42801d5ABEb9fcc288Bc4caBb11EE7`
([view on explorer](https://explorer-studio.genlayer.com/address/0x23045738dB42801d5ABEb9fcc288Bc4caBb11EE7)).

This is the contract with the steward-review changes (derived verdict, owner-only declarations,
one declaration per version, `get_declaration_id` and `get_latest_declaration_for`).
`CONTRACT_ADDRESS` in `frontend/src/config/chains.ts` is set to this address. If the contract is
ever redeployed, update that one line and this section together.

**Live status:** all three verdict paths were run against this address on Oct 3, 2026 (see
"Live verification of the current deployment" below).

## What the test suite proves, and what it does not

`tests/test_scopeseal.py` — 81 direct-mode tests, executed under `genlayer-test==0.29.2` against
the real contract via `pytest tests -q -p no:cacheprovider`. All 81 pass.

**Proves:**
- Every write method's deterministic guards: invalid package names and versions (including URL
  characters), duplicate profiles, scope above the ceiling, owner-only declaration, one
  declaration per version, double-checking a declaration.
- The verdict is derived from observed facts: a 14-case matrix (undeclared preinstall / install /
  postinstall, declared-and-allowed scripts, dependency count at, over and under declared and
  ceiling limits, undeclared engines / os, declared platform restriction) where the mocked LLM
  always states the opposite verdict and the stored verdict still follows the facts.
- A contradicting or thin LLM explanation is discarded and replaced by derived text; an agreeing
  one is stored.
- `declare_release` returns the new id and `get_declaration_id` / `get_latest_declaration_for`
  return it, case-insensitively for addresses.
- All three verdict values are reachable (`INCONCLUSIVE` via 404, HTTP error, unparseable body and
  identifier mismatch).
- Validator rules: rejects a result where only one fact differs, where the verdict conflicts with
  the facts, where facts are wrongly typed, where reasoning is thin or the path is unknown, where
  the leader errored, or where the validator's own fetch disagrees. It runs with no LLM mock.
- Untrusted fetched content is wrapped as data; malformed LLM output reverts.
- `check_pickling` confirms no storage-backed object crosses into the nondet closure.
- Mutation check (run once): making the leader return the LLM's verdict instead of the derived one
  fails 14 of these tests.

**Does not prove:**
- How a real, non-mocked LLM behaves on a genuinely ambiguous manifest.
- Real registry behavior or real multi-node consensus timing on the changed contract.
- Browser, wallet or live-network behavior of the frontend (see `docs/FRONTEND.md`).

## Live verification of the current deployment (Oct 3, 2026)

Run through GenLayer Studio's Run and Debug panel against `0x23045738dB42801d5ABEb9fcc288Bc4caBb11EE7`,
all from one account (`0xFd308E47932c37c8aFCcd138484bd7A769F6dB9E`, the profile owner), with real
GenVM validator consensus and a real npm registry fetch. All eight transactions finalized with
`Execution Result: SUCCESS`, `Consensus Result: Accepted`, 5 validators, rotation count 0, and empty
`Stdout`/`Stderr`.

| Step | Call | Result | Transaction |
|---|---|---|---|
| 1 | `register_profile("left-pad", false, 10, false)` | `registered` | [0xf354118ffbecd11cfcbe7da431785a9876ca632f4a862ce880b391f68ba15bc3](https://explorer-studio.genlayer.com/tx/0xf354118ffbecd11cfcbe7da431785a9876ca632f4a862ce880b391f68ba15bc3) |
| 2 | `declare_release("left-pad", "1.3.0", false, 5, false)` | returned `declaration_id: 1` | [0x92a2764bc5ff2ba1aac1758925101c6a60a6c6286a5b461b6fa329ed19972e23](https://explorer-studio.genlayer.com/tx/0x92a2764bc5ff2ba1aac1758925101c6a60a6c6286a5b461b6fa329ed19972e23) |
| 3 | `check_compliance(1)` | **COMPLIANT** (0 deps, no lifecycle script, no platform restriction) | [0xebf17a344dbfd197160855abfaa3a88b19234a536fbf1f211c356bd37ce20dcf](https://explorer-studio.genlayer.com/tx/0xebf17a344dbfd197160855abfaa3a88b19234a536fbf1f211c356bd37ce20dcf) |
| 4 | `register_profile("electron", false, 10, false)` | `registered` | [0x4c29a51615a3fcaf9cfb8b5b955fbc7ba470d1aad4a07738df6a15dfd35c2071](https://explorer-studio.genlayer.com/tx/0x4c29a51615a3fcaf9cfb8b5b955fbc7ba470d1aad4a07738df6a15dfd35c2071) |
| 5 | `declare_release("electron", "30.0.0", false, 5, false)` | returned `declaration_id: 2` | [0xfd72844ea154ff65ba60602506e57f3e44f938683695ea775bbff99b2ea8a816](https://explorer-studio.genlayer.com/tx/0xfd72844ea154ff65ba60602506e57f3e44f938683695ea775bbff99b2ea8a816) |
| 6 | `check_compliance(2)` | **SCOPE_VIOLATION** (3 deps, `postinstall` present, `engines` present) | [0xee44c3682d212befd62bf6e446aaf1f82976a9820b0b2f86cbdc33029f6b8658](https://explorer-studio.genlayer.com/tx/0xee44c3682d212befd62bf6e446aaf1f82976a9820b0b2f86cbdc33029f6b8658) |
| 7 | `declare_release("left-pad", "99.0.0", false, 5, false)` | returned `declaration_id: 3` | [0xfafa79e8070c67f9c9f9a96f76c2b9dc4ecf86282449f44bdaef831786833eb5](https://explorer-studio.genlayer.com/tx/0xfafa79e8070c67f9c9f9a96f76c2b9dc4ecf86282449f44bdaef831786833eb5) |
| 8 | `check_compliance(3)` | **INCONCLUSIVE** (`version_not_published`) | [0x4bd2ae5ca1af1ea1d71270b09211f0f61be9ec28550c02daaa075a6cda7f58d9](https://explorer-studio.genlayer.com/tx/0x4bd2ae5ca1af1ea1d71270b09211f0f61be9ec28550c02daaa075a6cda7f58d9) |

The equivalence-output panel of each check shows the validator-agreed facts
(`dependency_count`, `has_lifecycle_script`, `has_platform_restriction`, `path`) next to the
verdict, and each verdict is the one `_derive_verdict` yields from those facts. The
`declare_release` return values carry the new declaration id, which is steward item 4 working on
the live network.

**Not yet run live against this deployment:** the revert cases (duplicate version declaration,
re-checking a checked declaration, declaring from a non-owner wallet), the persisted-id views
(`get_declaration_id`, `get_latest_declaration_for`) and the ledger views, a leader rotation, and the
deployed frontend's end-to-end flow. Those are covered only by the direct-mode and vitest suites.

## Live verification of the earlier deployment (Sep 25, 2026)

This was run against the contract deployed before the steward-review changes, not the current
source. It is kept as history.

All three verdict paths were run against the real deployed contract on StudioNet, through the live
app, with real GenVM validator consensus and a real npm registry fetch — not mocked.

| Declaration | Package@version | Ceiling / declared scope | Verdict | Transaction |
|---|---|---|---|---|
| #1 | `left-pad@1.3.0` | scripts forbidden, deps ≤ 10 / ≤ 5, platform forbidden | **COMPLIANT** | [0x02e57f5ba894912d51954222d9709b6dc062831184e79d27211c3454c96985ba](https://explorer-studio.genlayer.com/tx/0x02e57f5ba894912d51954222d9709b6dc062831184e79d27211c3454c96985ba) |
| #2 | `electron@28.0.0` | scripts forbidden, deps ≤ 10 / ≤ 5, platform forbidden | **SCOPE_VIOLATION** | [0x53fbd00194138958e084c42060956dbe96edab87b9bf52898bc647b9305b1d02](https://explorer-studio.genlayer.com/tx/0x53fbd00194138958e084c42060956dbe96edab87b9bf52898bc647b9305b1d02) |
| #3 | `left-pad@999.999.999` | scripts forbidden, deps ≤ 10 / ≤ 5, platform forbidden | **INCONCLUSIVE** (`version_not_published`) | [0x8985f9578f402c38800fc20c898d5fde37753e97eca5bc8f45d88bfbef0847bd](https://explorer-studio.genlayer.com/tx/0x8985f9578f402c38800fc20c898d5fde37753e97eca5bc8f45d88bfbef0847bd) |

All three transactions finalized with `Execution Result: SUCCESS`, `Consensus Result: Accepted`,
and empty `Stdout`/`Stderr`, across 5 validators. The reasoning returned by consensus for #1 and #2
correctly cites the real, specific fields it found in each package's actual published manifest
(no scripts/deps/platform fields for left-pad; a `scripts.postinstall` entry and an `engines`
restriction for electron) — not generic language, and not a coarse pass/fail with no basis shown.

This confirms, on the live network rather than only in direct-mode mocks: the npm registry fetch
resolves correctly for a real package+version, the LLM judgment reaches the correct verdict on
real (unambiguous) evidence, cross-validator consensus agrees cleanly with zero rotations across
all three checks, and the `INCONCLUSIVE` path triggers correctly on a genuinely unpublished
version rather than erroring or guessing.

**Not yet exercised live:** a case where independent validators land on different LLM outputs and
a leader rotation actually occurs (all three checks above converged on the first attempt); the
frontend's error-boundary and timeout-handling paths (every write above completed within normal
time).

## Local verification

```bash
pip install -r requirements-dev.txt
python -m compileall -q contracts tests
genvm-lint check contracts/scopeseal.py
pytest tests -q -p no:cacheprovider
cd frontend
npm ci --no-audit --no-fund
npm run typecheck
npm run lint
npm test
npm run build
```

`.github/workflows/ci.yml` runs the same commands. `genvm-lint check` passes (3 checks, 9 methods:
6 view, 3 write).
