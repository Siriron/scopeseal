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
  LLM judgment (COMPLIANT | SCOPE_VIOLATION), independently re-derived
  by every validator from the same fetched bytes
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
- **Every decision-bearing field is independently re-derived.** `validator_fn`
  does not just check that the leader's output is well-formed JSON — it
  calls `leader_fn()` itself and compares the verdict, the lifecycle-script
  flag, the exact dependency count, and the platform-restriction flag,
  field by field.

## Storage

- `profiles: TreeMap[str, PublishProfile]` — one ceiling per package name.
- `declarations: TreeMap[u256, ReleaseDeclaration]` — one locked scope +
  eventual verdict per version declaration.
- `ledgers: TreeMap[str, PackageLedger]` — permanent, public compliance
  counters per package.

No `DynArray` anywhere in this contract — every field is a scalar or a
fixed-shape record, so the delimiter-joined-string workaround this project
uses elsewhere for array-shaped nested fields was never needed here.
