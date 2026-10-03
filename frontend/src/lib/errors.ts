import { TxFailure, type TxFailureKind } from "./client";

export interface ErrorView {
  kind: TxFailureKind | "error";
  message: string;
  txHash?: string;
}

const TITLES: Record<TxFailureKind | "error", string> = {
  wallet_rejected: "Rejected in wallet",
  consensus_rejected: "Rejected by validators",
  reverted: "Reverted by the contract",
  timed_out: "Timed out waiting for consensus",
  error: "Something went wrong",
};

export function errorTitle(kind: ErrorView["kind"]): string {
  return TITLES[kind];
}

export function toErrorView(err: unknown, fallback: string): ErrorView {
  if (err instanceof TxFailure) {
    return { kind: err.kind, message: err.message, txHash: err.txHash };
  }
  const message = err instanceof Error && err.message ? err.message : fallback;
  return { kind: "error", message };
}
