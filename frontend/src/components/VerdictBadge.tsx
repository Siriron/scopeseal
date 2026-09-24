import type { Verdict } from "../types";

const STYLES: Record<string, string> = {
  COMPLIANT: "bg-moss/10 text-moss border-moss/40",
  SCOPE_VIOLATION: "bg-oxblood/10 text-oxblood border-oxblood/40",
  INCONCLUSIVE: "bg-amber/10 text-amber border-amber/40",
  "": "bg-slate/10 text-slate border-slate/30",
};

const LABELS: Record<string, string> = {
  COMPLIANT: "compliant",
  SCOPE_VIOLATION: "scope violation",
  INCONCLUSIVE: "inconclusive",
  "": "pending",
};

export function VerdictBadge({ verdict }: { verdict: Verdict | string }) {
  const key = verdict in STYLES ? verdict : "";
  return (
    <span className={`inline-block font-mono text-xs px-2.5 py-1 border rounded-sm ${STYLES[key]}`}>
      {LABELS[key]}
    </span>
  );
}
