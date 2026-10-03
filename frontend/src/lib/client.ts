import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { STUDIONET_CONFIG } from "../config/chains";

export type TxFailureKind = "wallet_rejected" | "consensus_rejected" | "reverted" | "timed_out";

/** A transaction that did not end in an accepted, successful execution. */
export class TxFailure extends Error {
  kind: TxFailureKind;
  txHash?: string;
  constructor(kind: TxFailureKind, message: string, txHash?: string) {
    super(message);
    this.kind = kind;
    this.txHash = txHash;
  }
}

/** Turns whatever a wallet/RPC threw while submitting into a TxFailure when it is a user rejection. */
export function asSubmitError(err: any): Error {
  const msg = String(err?.shortMessage ?? err?.message ?? "");
  if (err?.code === 4001 || err?.code === "ACTION_REJECTED" || /user (rejected|denied)|rejected the request/i.test(msg)) {
    return new TxFailure("wallet_rejected", "You rejected the request in your wallet. Nothing was sent.");
  }
  return err instanceof Error ? err : new Error(msg || "The transaction could not be submitted.");
}

const TIMEOUT_STATES = ["LEADER_TIMEOUT", "VALIDATORS_TIMEOUT"];
const REJECTED_STATES = ["UNDETERMINED", "CANCELED"];
const REJECTED_RESULTS = ["DISAGREE", "NO_MAJORITY", "MAJORITY_DISAGREE", "DETERMINISTIC_VIOLATION", "TIMEOUT"];

/**
 * Classifies a decided receipt. Returns normally only for an accepted/finalized
 * transaction whose execution did not error; every other outcome throws a TxFailure.
 */
export function classifyReceipt(tx: any, hash: string): void {
  const status = String(tx?.statusName ?? "");
  const result = String(tx?.resultName ?? "");
  const leader = tx?.consensus_data?.leader_receipt?.[0];
  const exec = String(tx?.txExecutionResultName ?? "");
  const leaderErr = typeof leader?.error === "string" && leader.error ? leader.error : "";

  if (TIMEOUT_STATES.includes(status)) {
    throw new TxFailure("timed_out", "Validators timed out before reaching a decision.", hash);
  }
  if (REJECTED_STATES.includes(status) || REJECTED_RESULTS.includes(result)) {
    throw new TxFailure(
      "consensus_rejected",
      `Validators did not accept this transaction (${status || result}). No state was changed.`,
      hash
    );
  }
  if (exec === "FINISHED_WITH_ERROR" || String(leader?.execution_result ?? "") === "ERROR") {
    throw new TxFailure(
      "reverted",
      `The contract reverted the transaction${leaderErr ? `: ${leaderErr}` : "."} No state was changed.`,
      hash
    );
  }
}

export async function ensureChain(): Promise<void> {
  const eth = (window as any).ethereum;
  if (!eth) return;
  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: STUDIONET_CONFIG.chainId }],
    });
  } catch (err: any) {
    if (err && err.code === 4902) {
      await eth.request({ method: "wallet_addEthereumChain", params: [STUDIONET_CONFIG] });
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: STUDIONET_CONFIG.chainId }],
      });
    } else if (err && err.code === -32002) {
      await new Promise((r) => setTimeout(r, 3000));
    } else {
      throw err;
    }
  }
}

export function getReadClient() {
  return createClient({ chain: studionet });
}

export async function getWriteClient(account: string) {
  const client = createClient({
    chain: studionet,
    account: account as `0x${string}`,
    provider: (window as any).ethereum,
  });
  if (typeof (client as any).connect === "function") {
    try {
      await (client as any).connect("studionet");
    } catch {
      // defensive — not all SDK versions expose this
    }
  }
  return client;
}

export async function waitForReceipt(client: any, hash: string): Promise<void> {
  let tx: any;
  try {
    tx = await client.waitForTransactionReceipt({
      hash,
      status: "ACCEPTED",
      retries: 120,
      interval: 4000,
      fullTransaction: true,
    });
  } catch {
    throw new TxFailure(
      "timed_out",
      "Consensus is taking longer than expected. The transaction was submitted and may still complete.",
      hash
    );
  }
  classifyReceipt(tx, hash);
}
