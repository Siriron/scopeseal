import { useState } from "react";
import { useWallet } from "../lib/WalletContext";
import { checkCompliance, getDeclaration } from "../lib/contracts";
import { Spinner } from "./Spinner";
import { VerdictBadge } from "./VerdictBadge";
import { EXPLORER_TX_URL } from "../config/chains";
import type { ReleaseDeclaration } from "../types";

export function CheckPanel() {
  const { account, connect } = useWallet();
  const [declarationId, setDeclarationId] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "done" | "error">("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [result, setResult] = useState<ReleaseDeclaration | null>(null);
  const [error, setError] = useState("");

  const idValid = /^\d+$/.test(declarationId) && Number(declarationId) > 0;

  async function handleSubmit() {
    if (!account) {
      await connect();
      return;
    }
    setStatus("pending");
    setError("");
    setResult(null);
    try {
      const hash = await checkCompliance(account, Number(declarationId));
      setTxHash(hash);
      const decl = await getDeclaration(Number(declarationId));
      setResult(decl);
      setStatus("done");
    } catch (err: any) {
      setError(err?.message ?? "The compliance check didn't complete.");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate leading-relaxed">
        This is the write that runs GenLayer validator consensus. Validators fetch the version's
        real manifest from the npm registry, derive what it actually contains, and compare that
        against what was declared and what the ceiling allows.
      </p>

      <div>
        <label className="block text-sm text-ink mb-1">Declaration ID</label>
        <input
          value={declarationId}
          onChange={(e) => setDeclarationId(e.target.value)}
          placeholder="1"
          className="w-full font-mono text-sm px-3 py-2 border border-ink/30 bg-white/60 focus:border-oxblood outline-none"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!idValid || status === "pending"}
        className="font-mono text-sm px-5 py-2.5 bg-ink text-parchment hover:bg-oxblood transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {status === "pending" ? <Spinner label="running consensus…" /> : "run compliance check"}
      </button>

      {status === "pending" && (
        <p className="text-xs text-slate">
          This step involves a live LLM judgment across validators — it can take several minutes
          to finalize. If the page seems stuck, the transaction may have still gone through; check
          the explorer link once it appears.
        </p>
      )}

      {status === "done" && result && (
        <div className="border border-ink/20 p-5 space-y-3 bg-white/40">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-ink">
              {result.package_name}@{result.version}
            </span>
            <VerdictBadge verdict={result.verdict} />
          </div>
          {result.status === "checked" && result.verdict !== "INCONCLUSIVE" && (
            <dl className="grid grid-cols-2 gap-2 text-xs font-mono text-slate">
              <dt>lifecycle script observed</dt>
              <dd>{result.observed_has_lifecycle_script ? "yes" : "no"}</dd>
              <dt>dependency count observed</dt>
              <dd>{result.observed_dependency_count}</dd>
              <dt>platform restriction observed</dt>
              <dd>{result.observed_has_platform_restriction ? "yes" : "no"}</dd>
            </dl>
          )}
          {result.reasoning_summary && (
            <p className="text-sm text-ink/80 border-t border-ink/10 pt-3">{result.reasoning_summary}</p>
          )}
          {txHash && (
            <a
              href={EXPLORER_TX_URL(txHash)}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-oxblood underline"
            >
              view transaction
            </a>
          )}
        </div>
      )}
      {status === "error" && <p className="text-sm text-oxblood">{error}</p>}
    </div>
  );
}
