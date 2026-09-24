import { useWallet } from "../lib/WalletContext";

function truncate(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function Header() {
  const { account, connecting, connect } = useWallet();

  return (
    <header className="border-b border-ink/15">
      <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg width="26" height="26" viewBox="0 0 64 64" className="shrink-0">
            <circle cx="32" cy="32" r="30" fill="#8B3A2F" />
            <path
              d="M32 14 L46 22 L46 38 L32 50 L18 38 L18 22 Z"
              fill="none"
              stroke="#F0E6D6"
              strokeWidth="2.5"
            />
            <circle cx="32" cy="32" r="6" fill="#F0E6D6" />
          </svg>
          <span className="font-serif text-lg tracking-tight text-ink">ScopeSeal</span>
        </div>
        <div className="flex items-center gap-4">
        <a href="#/docs" className="font-mono text-xs text-slate hover:text-oxblood transition-colors">
          docs
        </a>
        <button
          onClick={connect}
          disabled={connecting}
          className="font-mono text-xs px-4 py-2 border border-ink/40 text-ink hover:border-oxblood hover:text-oxblood transition-colors disabled:opacity-50"
        >
          {account ? truncate(account) : connecting ? "connecting…" : "connect wallet"}
        </button>
        </div>
      </div>
    </header>
  );
}
