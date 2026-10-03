import { useState } from "react";
import { useWallet } from "../lib/WalletContext";
import { declareRelease, getProfile } from "../lib/contracts";
import { isValidPackageName, isValidVersion } from "../lib/validation";
import { toErrorView, type ErrorView } from "../lib/errors";
import { ScopeFields, type ScopeValue } from "./ScopeFields";
import { Spinner } from "./Spinner";
import { TxFailureNotice } from "./TxFailureNotice";
import { EXPLORER_TX_URL } from "../config/chains";
import type { CheckTarget } from "./CheckPanel";
import type { ReleaseDeclaration } from "../types";

interface Ceiling {
  max: number;
  scripts: boolean;
  platform: boolean;
  owner: string;
}

export function DeclarePanel({ onRunCheck }: { onRunCheck: (target: CheckTarget) => void }) {
  const { account, connect } = useWallet();
  const [packageName, setPackageName] = useState("");
  const [version, setVersion] = useState("");
  const [scope, setScope] = useState<ScopeValue>({
    allowLifecycleScripts: false,
    maxDependencyCount: "0",
    allowPlatformRestriction: false,
  });
  const [ceiling, setCeiling] = useState<Ceiling | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "done" | "error">("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [created, setCreated] = useState<ReleaseDeclaration | null>(null);
  const [error, setError] = useState<ErrorView | null>(null);

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
        setLookupError("No profile is registered for this package yet — register one first.");
      } else {
        setCeiling({
          max: p.max_dependency_count,
          scripts: p.allow_lifecycle_scripts,
          platform: p.allow_platform_restriction,
          owner: p.owner,
        });
        setLookupError("");
      }
    } catch {
      setLookupError("Couldn't look up that package's profile.");
    } finally {
      setCheckingProfile(false);
    }
  }

  const overCeiling =
    ceiling !== null &&
    ((scope.allowLifecycleScripts && !ceiling.scripts) ||
      (depValid && Number(scope.maxDependencyCount) > ceiling.max) ||
      (scope.allowPlatformRestriction && !ceiling.platform));

  const notOwner = ceiling !== null && account !== null && ceiling.owner.toLowerCase() !== account.toLowerCase();

  async function handleSubmit() {
    if (!account) {
      await connect();
      return;
    }
    setStatus("pending");
    setError(null);
    setCreated(null);
    setTxHash(null);
    try {
      const res = await declareRelease(
        account,
        packageName.trim(),
        version.trim(),
        scope.allowLifecycleScripts,
        Number(scope.maxDependencyCount),
        scope.allowPlatformRestriction
      );
      setTxHash(res.hash);
      setCreated(res.declaration);
      setStatus("done");
    } catch (err: any) {
      setError(toErrorView(err, "The declaration didn't go through."));
      setStatus("error");
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate leading-relaxed">
        Lock the scope for one exact version before it's checked. Once submitted, this cannot be
        edited — that's what makes the later check mean something. Only the profile owner can
        declare, and each version can be declared once.
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
      {lookupError && <p className="text-sm text-oxblood">{lookupError}</p>}
      {ceiling && (
        <p className="text-xs text-slate font-mono">
          ceiling — scripts: {ceiling.scripts ? "allowed" : "forbidden"}, deps ≤ {ceiling.max}, platform
          restriction: {ceiling.platform ? "allowed" : "forbidden"}
        </p>
      )}
      {notOwner && ceiling && (
        <p className="text-sm text-oxblood">
          Only the profile owner ({ceiling.owner}) can declare releases for this package.
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
        disabled={!nameValid || !versionValid || !depValid || overCeiling || notOwner || status === "pending"}
        className="font-mono text-sm px-5 py-2.5 bg-ink text-parchment hover:bg-oxblood transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {status === "pending" ? <Spinner label="declaring…" /> : "lock declaration"}
      </button>

      {status === "pending" && (
        <p className="text-xs text-slate">
          Waiting for GenLayer consensus — usually a minute or two. Keep this page open.
        </p>
      )}

      {status === "done" && created && (
        <div className="border border-moss/40 bg-moss/5 p-4 space-y-3">
          <p className="text-sm text-moss">
            Declaration #{created.declaration_id} locked for{" "}
            <span className="font-mono">
              {created.package_name}@{created.version}
            </span>
            , read back from the contract and verified.
          </p>
          <div className="flex flex-wrap gap-4 items-center">
            <button
              onClick={() => onRunCheck({ packageName: created.package_name, version: created.version })}
              className="font-mono text-sm px-4 py-2 bg-ink text-parchment hover:bg-oxblood transition-colors"
            >
              run the check for this declaration
            </button>
            {txHash && (
              <a href={EXPLORER_TX_URL(txHash)} target="_blank" rel="noreferrer" className="text-xs underline">
                view transaction
              </a>
            )}
          </div>
          <p className="text-xs text-slate">
            The check only succeeds once this version is actually published on npm; before that it ends
            INCONCLUSIVE and cannot be re-run.
          </p>
        </div>
      )}
      {status === "error" && error && <TxFailureNotice error={error} />}
    </div>
  );
}
