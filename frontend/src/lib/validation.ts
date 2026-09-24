export function isValidPackageName(name: string): boolean {
  const n = name.trim();
  if (n.length === 0 || n.length > 214) return false;
  if (n !== n.toLowerCase()) return false;
  if (n.startsWith(".") || n.startsWith("_")) return false;
  if (n.includes(" ") || n.includes("\\")) return false;
  return true;
}

export function isValidVersion(version: string): boolean {
  const v = version.trim();
  if (v.length === 0 || v.length > 64) return false;
  const parts = v.split(".");
  if (parts.length < 2) return false;
  for (const p of parts.slice(0, 3)) {
    const core = p.split("-")[0].split("+")[0];
    if (!/^\d+$/.test(core)) return false;
  }
  return true;
}
