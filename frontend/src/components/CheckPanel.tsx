import { useEffect, useState } from "react";
import { useWallet } from "../lib/WalletContext";
import { checkCompliance, getDeclaration, getDeclarationId, getLatestDeclarationFor } from "../lib/contracts";
import { isValidPackageName, isValidVersion } from "../lib/validation";
import { toErrorView, type ErrorView } from "../lib/errors";
import { Spinner } from "./Spinner";
import { VerdictBadge } from "./VerdictBadge";
import { TxFailureNotice } from "./TxFailureNotice";
import { EXPLORER_TX_URL } from "../config/chains";
import type { ReleaseDeclaration } from "../types";

export interface CheckTarget {
  packageName: string;
  version: string;
}

type Phase = "idle" | "loading" | "ready" | "pending" | "done" | "error";

export function CheckPanel({ prefill }: { prefill: CheckTarget | null }) {
  const { account, connect } = useWallet();
  const [packageName, setPackageName] = useState(prefill?.packageName ?? "");
  const [version, setVersion] = useState(prefill?.version ?? "");
  const [declaration, setDeclaration] = useState<ReleaseDeclaration | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<ErrorView | null>(null);
  const [notice, setNotice] = useState("");

  const formValid = isValidPackageName(packageName) && isValidVersion(version);

  async function loadDeclaration(pkg = packageName.trim(), ver = version.trim()) {
    setPhase("loading");
    setError(null);
    setNotice("");
    setDeclaration(null);
    try {
      const found = await getDeclarationId(pkg, ver);
      if (typeof found.declaration_id !== "number") {
        setNotice(`No declaration exists for ${pkg}@${ver}. Declare the release first.`);
        setPhase("idle");
        return;
      }
      const d = await getDeclaration(found.declaration_id);
      if (d.package_name !== pkg || d.version !== ver) {
        throw new Error("The contract returned a declaration for a different package or version.");
      }
      setDeclaration(d);
      setPhase(d.status === "checked" ? "done" : "ready");
    } catch (err) {
      setError(toErrorView(err, "Couldn't read that declaration from the contract."));
      setPhase("error");
    }
  }

  async function useMyLatest() {
    if (!account) {
      await connect();
      return;
    }
    setPhase("loading");
    setError(null);
    setNotice("");
    try {
      const latest = await getLatestDeclarationFor(account);
      if (typeof latest.declaration_id !== "number") {
        setNotice("This wallet has not made a declaration yet.");
        setPhase("idle");
        return;
      }
      const d = await getDeclaration(latest.declaration_id);
      setPackageName(d.package_name);
      setVersion(d.version);
      setDeclaration(d);
      setPhase(d.status === "checked" ? "done" : "ready");
    } catch (err) {
      setError(toErrorView(err, "Couldn't read your latest declaration."));
      setPhase("error");
    }
  }

  useEffect(() => {
    if (prefill) void loadDeclaration(prefill.packageName, prefill.version);
  }, []);

  async function handleSubmit() {
    if (!account) {
      await connect();
      return;
    }
    if (!declaration || declaration.status !== "declared") return;
    setPhase("pending");
    setError(null);
    setTxHash(null);
    try {
      const res = await checkCompliance(account, {
        declarationId: declaration.declaration_id,
        packageName: declaration.package_name,
        version: declaration.version,
      });
      setTxHash(res.hash);
      setDeclaration(res.declaration);
      setPhase("done");
    } catch (err) {
      const view = toErrorView(err, "The compliance check didn't complete.");
      setError(view);
      setPhase("error");
    }
  }

  // After any failure, show what the contract actually holds rather than assuming.
  async function recheckState() {
    if (!declaration) return;
    setPhase("loading");
    try {
      const d = await getDeclaration(declaration.declaration_id);
      setDeclaration(d);
      if (d.status === "checked") {
        setError(null);
        setPhase("done");
      } else {
        setNotice("On-chain state: still unchecked. You can try the check again.");
        setPhase("ready");
      }
    } catch (err) {
      setError(toErrorView(err, "Couldn't re-read the declaration."));
      setPhase("error");
    }
  }

  const busy = phase === "loading" || phase === "pending";
  const target = declaration ? `${declaration.package_name}@${declaration.version}` : "";

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate leading-relaxed">
        Pick the package and version you declared. The check is bound to that declaration: validators
        fetch the version's real manifest from the npm registry, derive what it contains, and the
        contract derives the verdict from those facts.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-ink mb-1">Package name</label>
          <input
            value={packageName}
            onChange={(e) => {
              setPackageName(e.target.value);
              setDeclaration(null);
              setPhase("idle");
            }}
            placeholder="left-pad"
            className="w-full font-mono text-sm px-3 py-2 border border-ink/30 bg-white/60 focus:border-oxblood outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-ink mb-1">Version</label>
          <input
            value={version}
            onChange={(e) => {
              setVersion(e.target.value);
              setDeclaration(null);
              setPhase("idle");
            }}
            placeholder="1.3.0"
            className="w-full font-mono text-sm px-3 py-2 border border-ink/30 bg-white/60 focus:border-oxblood outline-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <button
          onClick={() => loadDeclaration()}
          disabled={!formValid || busy}
          className="font-mono text-sm px-4 py-2 border border-ink text-ink hover:bg-ink hover:text-parchment transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          load declaration
        </button>
        <button onClick={useMyLatest} disabled={busy} className="text-xs font-mono text-ink underline disabled:opacity-40">
          use my latest declaration
        </button>
        {phase === "loading" && <Spinner label="reading contract…" />}
      </div>

      {notice && <p className="text-sm text-slate">{notice}</p>}

      {declaration && (
        <div className="border border-ink/20 p-5 space-y-3 bg-white/40">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-ink">
              {target} <span className="text-slate">· declaration #{declaration.declaration_id}</span>
            </span>
            <VerdictBadge verdict={declaration.verdict} />
          </div>
          <dl className="grid grid-cols-2 gap-2 text-xs font-mono text-slate">
            <dt>declared lifecycle scripts</dt>
            <dd>{declaration.declared_allow_lifecycle_scripts ? "allowed" : "none"}</dd>
            <dt>declared max dependencies</dt>
            <dd>{declaration.declared_max_dependency_count}</dd>
            <dt>declared platform restriction</dt>
            <dd>{declaration.declared_allow_platform_restriction ? "allowed" : "none"}</dd>
            <dt>status</dt>
            <dd>{declaration.status}</dd>
          </dl>

          {declaration.status === "checked" && declaration.verdict !== "INCONCLUSIVE" && (
            <dl className="grid grid-cols-2 gap-2 text-xs font-mono text-slate border-t border-ink/10 pt-3">
              <dt>lifecycle script observed</dt>
              <dd>{declaration.observed_has_lifecycle_script ? "yes" : "no"}</dd>
              <dt>dependency count observed</dt>
              <dd>{declaration.observed_dependency_count}</dd>
              <dt>platform restriction observed</dt>
              <dd>{declaration.observed_has_platform_restriction ? "yes" : "no"}</dd>
            </dl>
          )}
          {declaration.status === "checked" && declaration.verdict === "INCONCLUSIVE" && (
            <p className="text-sm text-ink/80 border-t border-ink/10 pt-3">
              The registry had no usable manifest for this exact version when the check ran (not yet
              published, fetch failure, or identity mismatch). This declaration cannot be re-checked.
            </p>
          )}
          {declaration.reasoning_summary && (
            <p className="text-sm text-ink/80 border-t border-ink/10 pt-3">{declaration.reasoning_summary}</p>
          )}
          {phase === "done" && txHash && (
            <p className="text-xs text-moss">
              Check accepted and re-read from the contract for {target}.{" "}
              <a href={EXPLORER_TX_URL(txHash)} target="_blank" rel="noreferrer" className="underline">
                view transaction
              </a>
            </p>
          )}
        </div>
      )}

      {declaration && declaration.status === "declared" && (
        <button
          onClick={handleSubmit}
          disabled={busy}
          className="font-mono text-sm px-5 py-2.5 bg-ink text-parchment hover:bg-oxblood transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {phase === "pending" ? <Spinner label="running consensus…" /> : `run compliance check for ${target}`}
        </button>
      )}

      {phase === "pending" && (
        <p className="text-xs text-slate">
          This step involves a live LLM judgment across validators — it can take several minutes to
          finalize. Keep this page open; if it times out the transaction may still complete and you can
          re-read the state.
        </p>
      )}

      {phase === "error" && error && (
        <TxFailureNotice error={error} onRecheck={declaration ? recheckState : undefined} />
      )}
    </div>
  );
}
