export interface ScopeValue {
  allowLifecycleScripts: boolean;
  maxDependencyCount: string;
  allowPlatformRestriction: boolean;
}

export function ScopeFields({
  value,
  onChange,
  dependencyLabel = "Maximum dependency count",
}: {
  value: ScopeValue;
  onChange: (v: ScopeValue) => void;
  dependencyLabel?: string;
}) {
  return (
    <div className="space-y-4">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={value.allowLifecycleScripts}
          onChange={(e) => onChange({ ...value, allowLifecycleScripts: e.target.checked })}
          className="mt-1 accent-oxblood"
        />
        <span>
          <span className="block text-sm text-ink">Allow install-time lifecycle scripts</span>
          <span className="block text-xs text-slate">preinstall, install, or postinstall in package.json</span>
        </span>
      </label>

      <div>
        <label className="block text-sm text-ink mb-1">{dependencyLabel}</label>
        <input
          type="number"
          min={0}
          value={value.maxDependencyCount}
          onChange={(e) => onChange({ ...value, maxDependencyCount: e.target.value })}
          className="w-full font-mono text-sm px-3 py-2 border border-ink/30 bg-white/60 focus:border-oxblood outline-none"
          placeholder="e.g. 5"
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={value.allowPlatformRestriction}
          onChange={(e) => onChange({ ...value, allowPlatformRestriction: e.target.checked })}
          className="mt-1 accent-oxblood"
        />
        <span>
          <span className="block text-sm text-ink">Allow platform restrictions</span>
          <span className="block text-xs text-slate">engines, os, or cpu fields limiting where it installs</span>
        </span>
      </label>
    </div>
  );
}
