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
- How a real, non-mocked LLM actually behaves on a genuinely ambiguous manifest.
- Real network timing or real multi-node consensus behavior — the mocked `direct_vm` fixture
  substitutes for both the npm registry fetch and the LLM call.
- Anything about the frontend beyond `npm run typecheck` and `npm run build` passing; no live
  Studio deploy or live transaction has been run against this contract yet.

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
