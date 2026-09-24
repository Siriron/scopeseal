// Single source of truth for chain + contract configuration.
// This project targets GenLayer StudioNet exclusively.

export const STUDIONET_CONFIG = {
  chainId: "0xF22F", // 61999
  chainName: "GenLayer StudioNet",
  rpcUrls: ["https://studio.genlayer.com/api"],
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  blockExplorerUrls: ["https://explorer-studio.genlayer.com"],
};

export const EXPLORER_TX_URL = (hash: string) =>
  `https://explorer-studio.genlayer.com/tx/${hash}`;

export const EXPLORER_ADDRESS_URL = (address: string) =>
  `https://explorer-studio.genlayer.com/address/${address}`;

// Update this one line after each redeploy — this is the only place the
// deployed contract address lives.
export const CONTRACT_ADDRESS = "0xb75215a19AD9d4d46845CB4686c664E16af13199";
