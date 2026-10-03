# Contracts

## `contracts/scopeseal.py`

Single contract, `ScopeSeal(gl.Contract)`.

### Writes

| Method | Nondet? | Purpose |
|---|---|---|
| `register_profile(package_name, allow_lifecycle_scripts, max_dependency_count, allow_platform_restriction)` | No | Anchors the permanent ceiling for a package. Fails if a profile already exists for that name. |
| `declare_release(package_name, version, declared_allow_lifecycle_scripts, declared_max_dependency_count, declared_allow_platform_restriction)` | No | Locks the declared scope for one exact version. Owner-only, one declaration per `package@version`, rejected if it exceeds the profile ceiling on any field. Returns `{declaration_id, package_name, version, status}` and persists the id (see views). |
| `check_compliance(declaration_id)` | Yes | Fetches the npm registry manifest for the declared name+version and extracts the observed facts. The contract derives `COMPLIANT` / `SCOPE_VIOLATION` from those facts; `INCONCLUSIVE` comes from fetch or identifier failures. Validators re-fetch and re-derive. |

### Views

`get_profile(package_name)`, `get_declaration(declaration_id)`, `get_ledger(package_name)`,
`get_declaration_id(package_name, version)`, `get_latest_declaration_for(address)`,
`get_next_declaration_id()` — all return JSON strings via `json.dumps()`.

`declare_release` writes two lookups: `package@version → declaration id` and
`lowercase sender address → that sender's latest declaration id`. The frontend reads the new id
from `get_declaration_id` after the transaction is accepted; it never infers an id from the
global counter.

### Verdict derivation

`_derive_verdict(observed, declared, ceiling)` is a pure function. `SCOPE_VIOLATION` if any of:
a lifecycle script is present and either the declaration or the ceiling forbids it; the observed
dependency count exceeds `min(declared max, ceiling max)`; a platform restriction (`engines`,
`os`, `cpu`) is present and either side forbids it. Otherwise `COMPLIANT`.

The leader asks the LLM for an explanation only. If the model's verdict differs from the derived
one, or its text is too short, the model text is discarded and a deterministic explanation is
stored. `validator_fn` makes no LLM call: it re-fetches the manifest, requires the same path
(`CHECKED` / `INCONCLUSIVE`), requires every leader fact to be correctly typed and equal to its
own, requires the leader's verdict to equal the verdict derived from the leader's reported facts
and from its own facts, and requires a non-trivial explanation.

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
