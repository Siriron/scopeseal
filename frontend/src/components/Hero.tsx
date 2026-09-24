export function Hero() {
  return (
    <section className="max-w-5xl mx-auto px-6 pt-16 pb-14">
      <p className="font-mono text-xs text-oxblood tracking-wide mb-4">
        registry-bound compliance attestation
      </p>
      <h1 className="font-serif text-4xl sm:text-5xl leading-tight text-ink max-w-2xl mb-6">
        A package's declared scope, checked against what it actually publishes.
      </h1>
      <p className="text-slate max-w-xl leading-relaxed mb-10">
        A maintainer sets a ceiling for their package once. Before each release, they declare
        what that version will do — install scripts, dependency count, platform locks. When the
        version goes live, GenLayer validators independently fetch the real manifest from the npm
        registry and check that what actually shipped never exceeded what was declared, or what
        the ceiling ever permitted.
      </p>
      <div className="grid sm:grid-cols-3 gap-6 max-w-2xl">
        <Step n="1" label="Set the ceiling" body="Register the maximum any release of this package may ever do." />
        <Step n="2" label="Declare the release" body="Lock the scope for one version, before it's published." />
        <Step n="3" label="Check the manifest" body="Validators fetch the real registry record and compare." />
      </div>
    </section>
  );
}

function Step({ n, label, body }: { n: string; label: string; body: string }) {
  return (
    <div className="border-t-2 border-ink/20 pt-3">
      <div className="font-mono text-xs text-amber mb-1">{n}</div>
      <div className="font-serif text-base text-ink mb-1">{label}</div>
      <div className="text-sm text-slate leading-snug">{body}</div>
    </div>
  );
}
