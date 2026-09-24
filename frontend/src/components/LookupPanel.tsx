import { useState } from "react";
import { getLedger, getProfile } from "../lib/contracts";
import { isValidPackageName } from "../lib/validation";
import { Spinner } from "./Spinner";
import { VerdictBadge } from "./VerdictBadge";
import type { PackageLedger, PublishProfile } from "../types";

export function LookupPanel() {
  const [packageName, setPackageName] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<(PublishProfile & { status?: string }) | null>(null);
  const [ledger, setLedger] = useState<(PackageLedger & { status?: string }) | null>(null);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const nameValid = isValidPackageName(packageName);

  async function handleSearch() {
    if (!nameValid) return;
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const [p, l] = await Promise.all([getProfile(packageName.trim()), getLedger(packageName.trim())]);
      setProfile(p);
      setLedger(l);
    } catch {
      setError("Couldn't reach the contract for that lookup.");
    } finally {
      setLoading(false);
    }
  }

  const notRegistered = profile?.status === "not_registered";

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate leading-relaxed">
        Look up any package's declared ceiling and its full compliance history — this is the
        public ledger anyone can check before depending on a release.
      </p>

      <div className="flex gap-3">
        <input
          value={packageName}
          onChange={(e) => setPackageName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="left-pad"
          className="flex-1 font-mono text-sm px-3 py-2 border border-ink/30 bg-white/60 focus:border-oxblood outline-none"
        />
        <button
          onClick={handleSearch}
          disabled={!nameValid || loading}
          className="font-mono text-sm px-5 py-2 border border-ink text-ink hover:bg-ink hover:text-parchment transition-colors disabled:opacity-40"
        >
          {loading ? <Spinner label="looking up…" /> : "look up"}
        </button>
      </div>

      {error && <p className="text-sm text-oxblood">{error}</p>}

      {searched && !loading && notRegistered && (
        <p className="text-sm text-slate">No profile has been registered for this package yet.</p>
      )}

      {searched && !loading && profile && !notRegistered && ledger && (
        <div className="border border-ink/20 divide-y divide-ink/10 bg-white/40">
          <div className="p-5">
            <h3 className="font-serif text-lg text-ink mb-3">{profile.package_name}</h3>
            <dl className="grid grid-cols-2 gap-y-1 text-xs font-mono text-slate">
              <dt>lifecycle scripts</dt>
              <dd>{profile.allow_lifecycle_scripts ? "permitted" : "forbidden"}</dd>
              <dt>max dependencies</dt>
              <dd>{profile.max_dependency_count}</dd>
              <dt>platform restrictions</dt>
              <dd>{profile.allow_platform_restriction ? "permitted" : "forbidden"}</dd>
              <dt>owner</dt>
              <dd className="truncate">{profile.owner}</dd>
            </dl>
          </div>
          <div className="p-5">
            <h4 className="font-mono text-xs text-ink/60 mb-3 uppercase tracking-wide">compliance history</h4>
            <div className="flex items-center gap-6 mb-3">
              <Count label="compliant" value={ledger.compliant_count} color="text-moss" />
              <Count label="violations" value={ledger.violation_count} color="text-oxblood" />
              <Count label="inconclusive" value={ledger.inconclusive_count} color="text-amber" />
            </div>
            {ledger.latest_declaration_id > 0 && (
              <div className="flex items-center gap-2 text-xs font-mono text-slate">
                <span>latest — declaration #{ledger.latest_declaration_id}</span>
                <VerdictBadge verdict={ledger.latest_verdict} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Count({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className={`font-mono text-2xl ${color}`}>{value}</div>
      <div className="text-xs text-slate">{label}</div>
    </div>
  );
}
