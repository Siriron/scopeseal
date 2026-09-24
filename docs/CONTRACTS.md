# Contracts

## `contracts/scopeseal.py`

Single contract, `ScopeSeal(gl.Contract)`.

### Writes

| Method | Nondet? | Purpose |
|---|---|---|
| `register_profile(package_name, allow_lifecycle_scripts, max_dependency_count, allow_platform_restriction)` | No | Anchors the permanent ceiling for a package. Fails if a profile already exists for that name. |
| `declare_release(package_name, version, declared_allow_lifecycle_scripts, declared_max_dependency_count, declared_allow_platform_restriction)` | No | Locks the declared scope for one exact version. Rejected on-chain if it exceeds the package's own profile ceiling on any field. |
| `check_compliance(declaration_id)` | Yes | Fetches the real npm registry manifest for the declared name+version, derives the observed scope, and reaches a three-way verdict (`COMPLIANT` / `SCOPE_VIOLATION` / `INCONCLUSIVE`) through GenLayer validator consensus. |

### Views

`get_profile(package_name)`, `get_declaration(declaration_id)`, `get_ledger(package_name)`,
`get_next_declaration_id()` — all return JSON strings via `json.dumps()`.

### Verdict reachability

Every value the verdict field can take is traced against the exact `leader_fn` branch that
produces it (see the contract's own module docstring for the full trace) — no enum member is
legally accepted by `validator_fn` without a real code path that can emit it.

### Evidence source

`https://registry.npmjs.org/{name}/{version}` — public, unauthenticated, deterministically derived
from the declaration's own locked fields. Confirmed live (Sep 2026): returns the exact
`scripts`/`dependencies`/`engines`/`os`/`cpu` fields of the published manifest; 404s cleanly for an
unpublished version rather than returning a misleading record.

### Deliberate gaps

See the contract's own module docstring, "DELIBERATE GAPS" section — stated there rather than
duplicated here, so there is exactly one place that can go stale.
