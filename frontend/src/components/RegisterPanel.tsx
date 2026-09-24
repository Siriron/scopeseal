import { useState } from "react";
import { useWallet } from "../lib/WalletContext";
import { registerProfile } from "../lib/contracts";
import { isValidPackageName } from "../lib/validation";
import { ScopeFields, type ScopeValue } from "./ScopeFields";
import { Spinner } from "./Spinner";
import { EXPLORER_TX_URL } from "../config/chains";

export function RegisterPanel() {
  const { account, connect } = useWallet();
  const [packageName, setPackageName] = useState("");
  const [scope, setScope] = useState<ScopeValue>({
    allowLifecycleScripts: false,
    maxDependencyCount: "10",
    allowPlatformRestriction: false,
  });
  const [status, setStatus] = useState<"idle" | "pending" | "done" | "error">("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState("");

  const nameValid = isValidPackageName(packageName);
  const depValid = /^\d+$/.test(scope.maxDependencyCount) && Number(scope.maxDependencyCount) >= 0;

  async function handleSubmit() {
    if (!account) {
      await connect();
      return;
    }
    setStatus("pending");
    setError("");
    try {
      const hash = await registerProfile(
        account,
        packageName.trim(),
        scope.allowLifecycleScripts,
        Number(scope.maxDependencyCount),
        scope.allowPlatformRestriction
      );
      setTxHash(hash);
      setStatus("done");
    } catch (err: any) {
      setError(err?.message ?? "The registration didn't go through.");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate leading-relaxed mb-6">
          Set the maximum publish behavior this package will ever be allowed to declare. This is a
          ceiling, not a promise about any one version — every future release still makes its own
          declaration underneath it.
        </p>
        <label className="block text-sm text-ink mb-1">npm package name</label>
        <input
          value={packageName}
          onChange={(e) => setPackageName(e.target.value)}
          placeholder="left-pad"
          className="w-full font-mono text-sm px-3 py-2 border border-ink/30 bg-white/60 focus:border-oxblood outline-none"
        />
        {packageName.length > 0 && !nameValid && (
          <p className="text-xs text-oxblood mt-1">Not a valid npm package name.</p>
        )}
      </div>

      <ScopeFields value={scope} onChange={setScope} dependencyLabel="Maximum dependency count, ever" />

      <button
        onClick={handleSubmit}
        disabled={!nameValid || !depValid || status === "pending"}
        className="font-mono text-sm px-5 py-2.5 bg-ink text-parchment hover:bg-oxblood transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {status === "pending" ? <Spinner label="registering…" /> : "register profile"}
      </button>

      {status === "pending" && (
        <p className="text-xs text-slate">
          This is a deterministic write — usually fast, but GenLayer consensus can still take a
          minute or two to finalize.
        </p>
      )}
      {status === "done" && txHash && (
        <p className="text-sm text-moss">
          Profile registered.{" "}
          <a href={EXPLORER_TX_URL(txHash)} target="_blank" rel="noreferrer" className="underline">
            view transaction
          </a>
        </p>
      )}
      {status === "error" && <p className="text-sm text-oxblood">{error}</p>}
    </div>
  );
}
