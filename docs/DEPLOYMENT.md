# Deployment

## Network

GenLayer StudioNet exclusively.

| | StudioNet |
|---|---|
| Chain ID | 61999 (0xF22F) |
| RPC | https://studio.genlayer.com/api |
| Explorer | https://explorer-studio.genlayer.com |

## Current deployment

Deployed on GenLayer StudioNet: `0xb75215a19AD9d4d46845CB4686c664E16af13199`
([view on explorer](https://explorer-studio.genlayer.com/address/0xb75215a19AD9d4d46845CB4686c664E16af13199)).

`CONTRACT_ADDRESS` in `frontend/src/config/chains.ts` is set to this address. If the contract is
ever redeployed, update that one line and this section together.

## What the test suite proves, and what it does not

`tests/test_scopeseal.py` — 29 direct-mode tests, executed under `genlayer-test==0.29.2` against
the real contract via `pytest tests -q -p no:cacheprovider`. All 29 pass.

**Proves:**
- Every write method's deterministic guards (invalid package names, duplicate profiles, scope
  exceeding the profile ceiling, double-checking a declaration).
- All three verdict branches are genuinely reachable (`COMPLIANT`, `SCOPE_VIOLATION`,
  `INCONCLUSIVE` via 404, via HTTP error, and via a Rule-0.8 identifier mismatch).
- Validator agreement logic rejects a leader whose verdict, lifecycle-script flag, dependency
  count, platform-restriction flag, or reasoning length differs from independent re-derivation —
  field by field, not just the coarse verdict bucket.
- Untrusted fetched content is wrapped in delimiters the model is instructed to treat as data, not
  instructions (regression-tested against an injected "IGNORE ALL INSTRUCTIONS" string inside a
  mocked manifest field).
- Malformed LLM output reverts the transaction rather than storing a garbage verdict.
- `check_pickling` confirms no storage-backed object crosses into the nondet closure.

**Does not prove:**
- How a real, non-mocked LLM behaves on a genuinely ambiguous manifest (the live verification
  below used unambiguous real-world cases; the mocked test suite covers edge cases like malformed
  output and injection attempts that would be impractical to trigger live).
- Anything about the frontend beyond what the live verification below actually exercised.

## Live verification (Sep 25, 2026)

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
python -m compileall -q contracts tests
genvm-lint check contracts/scopeseal.py
pytest tests -q -p no:cacheprovider
cd frontend
npm ci --no-audit --no-fund
npm run typecheck
npm run build
```

`genvm-lint check` passed clean (3 checks, 7 methods: 4 view, 3 write) as of this writing.
