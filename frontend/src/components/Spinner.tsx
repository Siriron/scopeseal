export function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs text-slate">
      <span className="w-3 h-3 border-2 border-slate/30 border-t-oxblood rounded-full animate-spin" />
      {label ?? "working…"}
    </span>
  );
}
