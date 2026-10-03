# Architecture

## State machine

```
register_profile(package_name, ...)
        ↓
  PublishProfile anchored (ceiling, per package, immutable once set)
  PackageLedger initialized (compliant=0, violation=0, inconclusive=0)
        ↓
declare_release(package_name, version, ...)
        ↓
  ReleaseDeclaration locked, status="declared"
  (declared scope validated against the profile ceiling before it's ever stored)
        ↓
check_compliance(declaration_id)
        ↓
  leader_fn fetches registry.npmjs.org/{name}/{version}
        ↓
  404 or fetch error → verdict INCONCLUSIVE
  identifier mismatch (Rule 0.8) → verdict INCONCLUSIVE
  fetch OK → extract observed facts (script presence, dep count, platform)
        ↓
  verdict = _derive_verdict(observed facts, declared scope, profile ceiling)
  LLM writes the explanation only; a contradicting LLM verdict is discarded
        ↓
  every validator re-fetches, re-derives facts and verdict, and rejects any
  leader result whose verdict conflicts with the facts
        ↓
  ReleaseDeclaration.status="checked", verdict recorded
  PackageLedger counters updated
```

## Trust boundaries

- **Deterministic code never trusts a submitter-supplied URL.** The registry
  URL is built entirely from the declaration's own locked `package_name` and
  `version` — never accepted as a raw string from any caller.
- **The fetched record must echo the claimed identifier before it can
  influence the verdict.** If `registry.npmjs.org`'s own `name`/`version`
  fields in the response don't match the declaration, the result is
  `INCONCLUSIVE`, never a guessed verdict built on a record for something
  else.
- **The declared scope is locked before the check exists.** `declare_release`
  happens before `check_compliance` is ever called, so a maintainer cannot
  see the real published manifest and then retroactively declare a scope
  that happens to match it.
- **No storage-backed object crosses into the nondet closure.** Both the
  declaration and the profile are `copy_to_memory()`'d in the deterministic
  body of `check_compliance` before `run_nondet_unsafe` is entered.
- **The verdict is not an LLM output.** It is computed from the observed
  facts by `_derive_verdict`. `validator_fn` re-fetches the manifest itself
  (no LLM call), compares the lifecycle-script flag, exact dependency count
  and platform-restriction flag, and rejects a leader verdict that conflicts
  with the verdict derived from either the leader's or its own facts.
- **Declarations are owner-only and unique per version.** Otherwise a third
  party could declare a version first with a scope that guarantees a violation.

## Storage

- `profiles: TreeMap[str, PublishProfile]` — one ceiling per package name.
- `declarations: TreeMap[u256, ReleaseDeclaration]` — one locked scope +
  eventual verdict per version declaration.
- `ledgers: TreeMap[str, PackageLedger]` — permanent, public compliance
  counters per package.
- `declaration_keys: TreeMap[str, u256]` — `"<package>@<version>"` to declaration id.
- `latest_declaration_by_sender: TreeMap[str, u256]` — lowercase sender address to the id of
  that sender's latest declaration.

No `DynArray` anywhere in this contract — every field is a scalar or a
fixed-shape record, so the delimiter-joined-string workaround this project
uses elsewhere for array-shaped nested fields was never needed here.
