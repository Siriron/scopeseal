import { EXPLORER_TX_URL } from "../config/chains";
import { errorTitle, type ErrorView } from "../lib/errors";

export function TxFailureNotice({ error, onRecheck }: { error: ErrorView; onRecheck?: () => void }) {
  return (
    <div role="alert" className="border border-oxblood/40 bg-oxblood/5 p-4 space-y-2">
      <p className="text-sm text-oxblood font-medium">{errorTitle(error.kind)}</p>
      <p className="text-sm text-ink/80">{error.message}</p>
      <div className="flex flex-wrap gap-4 items-center">
        {error.txHash && (
          <a
            href={EXPLORER_TX_URL(error.txHash)}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-oxblood underline"
          >
            view transaction
          </a>
        )}
        {onRecheck && (
          <button onClick={onRecheck} className="text-xs font-mono text-ink underline">
            re-read on-chain state
          </button>
        )}
      </div>
    </div>
  );
}
