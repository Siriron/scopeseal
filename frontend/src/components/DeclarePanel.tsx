import { useState } from "react";
import { useWallet } from "../lib/WalletContext";
import { declareRelease, getProfile } from "../lib/contracts";
import { isValidPackageName, isValidVersion } from "../lib/validation";
import { ScopeFields, type ScopeValue } from "./ScopeFields";
import { Spinner } from "./Spinner";
import { EXPLORER_TX_URL } from "../config/chains";

export function DeclarePanel() {
  const { account, connect } = useWallet();
  const [packageName, setPackageName] = useState("");
  const [version, setVersion] = useState("");
  const [scope, setScope] = useState<ScopeValue>({
    allowLifecycleScripts: false,
    maxDependencyCount: "0",
    allowPlatformRestriction: false,
  });
  const [ceiling, setCeiling] = useState<{ max: number; scripts: boolean; platform: boolean } | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [status, setStatus] = useState<"idle" | "pending" | "done" | "error">("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState("");

  const nameValid = isValidPackageName(packageName);
  const versionValid = isValidVersion(version);
  const depValid = /^\d+$/.test(scope.maxDependencyCount) && Number(scope.maxDependencyCount) >= 0;

  async function lookupCeiling() {
    if (!nameValid) return;
    setCheckingProfile(true);
    setCeiling(null);
    try {
      const p = await getProfile(packageName.trim());
      if ((p as any).status === "not_registered") {
        setError("No profile is registered for this package yet — register one first.");
      } else {
        setCeiling({
          max: p.max_dependency_count,
          scripts: p.allow_lifecycle_scripts,
          platform: p.allow_platform_restriction,
        });
        setError("");
      }
    } catch {
      setError("Couldn't look up that package's profile.");
    } finally {
      setCheckingProfile(false);
    }
  }

  const overCeiling =
    ceiling !== null &&
    ((scope.allowLifecycleScripts && !ceiling.scripts) ||
      (depValid && Number(scope.maxDependencyCount) > ceiling.max) ||
      (scope.allowPlatformRestriction && !ceiling.platform));

  async function handleSubmit() {
    if (!account) {
      await connect();
      return;
    }
    setStatus("pending");
    setError("");
    try {
      const hash = await declareRelease(
        account,
        packageName.trim(),
        version.trim(),
        scope.allowLifecycleScripts,
        Number(scope.maxDependencyCount),
        scope.allowPlatformRestriction
      );
      setTxHash(hash);
      setStatus("done");
    } catch (err: any) {
      setError(err?.message ?? "The declaration didn't go through.");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate leading-relaxed">
        Lock the scope for one exact version before it's checked. Once submitted, this cannot be
        edited — that's what makes the later check mean something.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-ink mb-1">Package name</label>
          <input
            value={packageName}
            onChange={(e) => {
              setPackageName(e.target.value);
              setCeiling(null);
            }}
            onBlur={lookupCeiling}
            placeholder="left-pad"
            className="w-full font-mono text-sm px-3 py-2 border border-ink/30 bg-white/60 focus:border-oxblood outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-ink mb-1">Version</label>
          <input
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="1.3.0"
            className="w-full font-mono text-sm px-3 py-2 border border-ink/30 bg-white/60 focus:border-oxblood outline-none"
          />
        </div>
      </div>

      {checkingProfile && <Spinner label="looking up profile…" />}
      {ceiling && (
        <p className="text-xs text-slate font-mono">
          ceiling — scripts: {ceiling.scripts ? "allowed" : "forbidden"}, deps ≤ {ceiling.max}, platform
          restriction: {ceiling.platform ? "allowed" : "forbidden"}
        </p>
      )}

      <ScopeFields value={scope} onChange={setScope} dependencyLabel="Declared dependency count for this version" />

      {overCeiling && (
        <p className="text-sm text-oxblood">
          This declaration exceeds the package's own profile ceiling and will be rejected on-chain.
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!nameValid || !versionValid || !depValid || overCeiling || status === "pending"}
        className="font-mono text-sm px-5 py-2.5 bg-ink text-parchment hover:bg-oxblood transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {status === "pending" ? <Spinner label="declaring…" /> : "lock declaration"}
      </button>

      {status === "done" && txHash && (
        <p className="text-sm text-moss">
          Declaration locked.{" "}
          <a href={EXPLORER_TX_URL(txHash)} target="_blank" rel="noreferrer" className="underline">
            view transaction
          </a>
        </p>
      )}
      {status === "error" && <p className="text-sm text-oxblood">{error}</p>}
    </div>
  );
}
