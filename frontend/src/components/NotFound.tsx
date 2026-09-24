export function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center">
        <div className="font-serif text-6xl text-ink/20 mb-4">404</div>
        <p className="text-slate mb-6">There's no seal at this address.</p>
        <a href="#/" className="font-mono text-sm text-oxblood underline">
          back to ScopeSeal
        </a>
      </div>
    </div>
  );
}
