import { TransactionStatus } from "genlayer-js/types";
import { CONTRACT_ADDRESS } from "../config/chains";
import { ensureChain, getReadClient, getWriteClient, waitForReceipt } from "./client";
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

async function writeMethod(account: string, method: string, args: any[] = []) {
  await ensureChain();
  const client = await getWriteClient(account);
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    functionName: method,
    args,
    value: BigInt(0),
  });
  await waitForReceipt(client, hash);
  return hash;
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

export async function declareRelease(
  account: string,
  packageName: string,
  version: string,
  declaredAllowLifecycleScripts: boolean,
  declaredMaxDependencyCount: number,
  declaredAllowPlatformRestriction: boolean
) {
  return writeMethod(account, "declare_release", [
    packageName,
    version,
    declaredAllowLifecycleScripts,
    declaredMaxDependencyCount,
    declaredAllowPlatformRestriction,
  ]);
}

export async function checkCompliance(account: string, declarationId: number) {
  return writeMethod(account, "check_compliance", [declarationId]);
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
