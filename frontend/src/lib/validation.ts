const NAME_CHARS = /^[a-z0-9\-._~]+$/;
const VERSION_CHARS = /^[A-Za-z0-9.\-+]+$/;

// Mirrors the contract's _valid_package_name: npm's character set, optional single @scope/.
export function isValidPackageName(name: string): boolean {
  const n = name.trim();
  if (n.length === 0 || n.length > 214) return false;
  if (n !== n.toLowerCase()) return false;
  let parts = [n];
  if (n.startsWith("@")) {
    parts = n.slice(1).split("/");
    if (parts.length !== 2) return false;
  }
  return parts.every((p) => p.length > 0 && !p.startsWith(".") && !p.startsWith("_") && NAME_CHARS.test(p));
}

// Mirrors the contract's _valid_version.
export function isValidVersion(version: string): boolean {
  const v = version.trim();
  if (v.length === 0 || v.length > 64) return false;
  if (!VERSION_CHARS.test(v)) return false;
  const parts = v.split(".");
  if (parts.length < 2) return false;
  for (const p of parts.slice(0, 3)) {
    const core = p.split("-")[0].split("+")[0];
    if (!/^\d+$/.test(core)) return false;
  }
  return true;
}
