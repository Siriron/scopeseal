import { TransactionStatus } from "genlayer-js/types";
import { CONTRACT_ADDRESS } from "../config/chains";
import { asSubmitError, ensureChain, getReadClient, getWriteClient, waitForReceipt } from "./client";
import type { PackageLedger, PublishProfile, ReleaseDeclaration } from "../types";

async function readView<T>(method: string, args: any[] = []): Promise<T> {
  const client = getReadClient();
  const raw = await client.readContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    functionName: method,
    args,
  });
  return JSON.parse(raw as string) as T;
}

async function writeMethod(account: string, method: string, args: any[] = []): Promise<string> {
  await ensureChain();
  const client = await getWriteClient(account);
  let hash: string;
  try {
    hash = await client.writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      functionName: method,
      args,
      value: BigInt(0),
    });
  } catch (err) {
    throw asSubmitError(err);
  }
  await waitForReceipt(client, hash);
  return hash;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Reads can lag a moment behind an accepted write; retry a few times before giving up. */
async function readUntil<T>(read: () => Promise<T>, ok: (v: T) => boolean, tries = 5): Promise<T> {
  let last = await read();
  for (let i = 1; i < tries && !ok(last); i++) {
    await sleep(2000);
    last = await read();
  }
  return last;
}

export async function registerProfile(
  account: string,
  packageName: string,
  allowLifecycleScripts: boolean,
  maxDependencyCount: number,
  allowPlatformRestriction: boolean
) {
  return writeMethod(account, "register_profile", [
    packageName,
    allowLifecycleScripts,
    maxDependencyCount,
    allowPlatformRestriction,
  ]);
}

export interface DeclareResult {
  hash: string;
  declaration: ReleaseDeclaration;
}

/**
 * Submits the declaration, then looks the new declaration up on-chain by package + version
 * and verifies it belongs to this wallet and carries exactly what was submitted. The id is
 * never guessed from a counter.
 */
export async function declareRelease(
  account: string,
  packageName: string,
  version: string,
  declaredAllowLifecycleScripts: boolean,
  declaredMaxDependencyCount: number,
  declaredAllowPlatformRestriction: boolean
): Promise<DeclareResult> {
  const hash = await writeMethod(account, "declare_release", [
    packageName,
    version,
    declaredAllowLifecycleScripts,
    declaredMaxDependencyCount,
    declaredAllowPlatformRestriction,
  ]);
  const found = await readUntil(
    () => getDeclarationId(packageName, version),
    (r) => typeof r.declaration_id === "number"
  );
  if (typeof found.declaration_id !== "number") {
    throw new Error("The transaction was accepted but no declaration was found for this package and version.");
  }
  const declaration = await getDeclaration(found.declaration_id);
  const sameScope =
    declaration.declared_allow_lifecycle_scripts === declaredAllowLifecycleScripts &&
    declaration.declared_max_dependency_count === declaredMaxDependencyCount &&
    declaration.declared_allow_platform_restriction === declaredAllowPlatformRestriction;
  if (
    declaration.package_name !== packageName ||
    declaration.version !== version ||
    declaration.declarer.toLowerCase() !== account.toLowerCase() ||
    !sameScope
  ) {
    throw new Error("The stored declaration does not match what was submitted. Do not run a check against it.");
  }
  return { hash, declaration };
}

export interface CheckResult {
  hash: string;
  declaration: ReleaseDeclaration;
}

/**
 * Runs the check against a declaration the caller has already loaded and displayed, then
 * re-reads it and verifies it is still the same package@version and is now checked.
 */
export async function checkCompliance(
  account: string,
  shown: { declarationId: number; packageName: string; version: string }
): Promise<CheckResult> {
  const hash = await writeMethod(account, "check_compliance", [shown.declarationId]);
  const declaration = await readUntil(
    () => getDeclaration(shown.declarationId),
    (d) => d.status === "checked"
  );
  if (declaration.package_name !== shown.packageName || declaration.version !== shown.version) {
    throw new Error("The declaration on-chain is not the package and version that was displayed.");
  }
  if (declaration.status !== "checked") {
    throw new Error("The transaction was accepted but the declaration is not marked checked yet. Re-check its state.");
  }
  return { hash, declaration };
}

export async function getDeclarationId(
  packageName: string,
  version: string
): Promise<{ declaration_id?: number; status?: string }> {
  return readView("get_declaration_id", [packageName, version]);
}

export async function getLatestDeclarationFor(address: string): Promise<{ declaration_id?: number; status?: string }> {
  return readView("get_latest_declaration_for", [address]);
}

export async function getProfile(packageName: string): Promise<PublishProfile & { status?: string }> {
  return readView("get_profile", [packageName]);
}

export async function getDeclaration(declarationId: number): Promise<ReleaseDeclaration> {
  return readView("get_declaration", [declarationId]);
}

export async function getLedger(packageName: string): Promise<PackageLedger & { status?: string }> {
  return readView("get_ledger", [packageName]);
}

export async function getNextDeclarationId(): Promise<{ next_declaration_id: number }> {
  return readView("get_next_declaration_id");
}

export { TransactionStatus };
