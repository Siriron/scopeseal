const SECTIONS = [
  {
    title: "Overview",
    body: `ScopeSeal is an on-chain attestation of npm publish-scope compliance. A package
maintainer sets a permanent ceiling on what any release is ever allowed to do — install-time
lifecycle scripts, dependency count, platform restrictions. Before publishing a specific version,
they lock a declaration of exactly what that version will do, within the ceiling. Once the version
is live, a compliance check fetches the real registry manifest and GenLayer validators
independently confirm whether what actually shipped matched what was declared.`,
  },
  {
    title: "How it works",
    body: `Three writes: register_profile sets the ceiling once per package. declare_release locks
the scope for one exact version, before any compliance check exists — so it can't be reshaped once
the real numbers are known. check_compliance is the only write that touches consensus: it fetches
https://registry.npmjs.org/{name}/{version}, a public, unauthenticated, deterministic endpoint,
extracts the real script/dependency/platform fields, and both the leader and every validator
independently reach the same verdict from the same fetched bytes before it's accepted.`,
  },
  {
    title: "Architecture",
    body: `Single contract, three storage maps: profiles (per-package ceiling), declarations
(per-version locked scope and eventual verdict), and ledgers (a permanent per-package compliant /
violation / inconclusive count). There is no staking and no GEN transfer anywhere in this contract
— the consequence is reputation, held in the public ledger, not money.`,
  },
  {
    title: "Smart contracts",
    body: `contracts/scopeseal.py — the full contract. Deployed on GenLayer StudioNet (chain ID
61999). See the README for the current deployed address and deployment transaction.`,
  },
  {
    title: "API reference",
    body: `Writes — register_profile(package_name, allow_lifecycle_scripts, max_dependency_count,
allow_platform_restriction); declare_release(package_name, version, declared_allow_lifecycle_scripts,
declared_max_dependency_count, declared_allow_platform_restriction); check_compliance(declaration_id).
Views — get_profile(package_name), get_declaration(declaration_id), get_ledger(package_name),
get_next_declaration_id().`,
  },
  {
    title: "FAQ",
    body: `Why INCONCLUSIVE and not just pass/fail? Because a declared version sometimes isn't
published yet when it's checked, or the registry is briefly unreachable — forcing a binary verdict
in that case would be a guess, not a finding. Why reputation instead of staking? This is a
first-of-genre build for this concept; reputation keeps the mechanism legible without adding
settlement complexity a first version doesn't need. Why npm specifically? Its registry API is
public, unauthenticated, and returns a real, versioned, immutable manifest — exactly the kind of
independently fetchable evidence this contract needs to judge a claim rather than trust it.`,
  },
];

export function Docs() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <a href="#/" className="font-mono text-xs text-oxblood underline">
        ← back
      </a>
      <h1 className="font-serif text-3xl text-ink mt-6 mb-10">Documentation</h1>
      <div className="space-y-10">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="font-serif text-xl text-ink mb-3">{s.title}</h2>
            <p className="text-sm text-slate leading-relaxed whitespace-pre-line">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
