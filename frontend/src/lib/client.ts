import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { STUDIONET_CONFIG } from "../config/chains";

export class TimeoutError extends Error {
  txHash: string;
  isTimeout = true;
  constructor(hash: string) {
    super(
      `Consensus is taking longer than expected. Your transaction was submitted — you can check its status directly on the explorer.`
    );
    this.txHash = hash;
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

export async function waitForReceipt(client: any, hash: string) {
  try {
    return await client.waitForTransactionReceipt({
      hash,
      status: "ACCEPTED",
      retries: 120,
      interval: 4000,
    });
  } catch (err) {
    throw new TimeoutError(hash);
  }
}
