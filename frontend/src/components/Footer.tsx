import { CONTRACT_ADDRESS, EXPLORER_ADDRESS_URL } from "../config/chains";

export function Footer() {
  return (
    <footer className="border-t border-ink/15 mt-8">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate">
        <span>ScopeSeal · GenLayer StudioNet</span>
        <a
          href={EXPLORER_ADDRESS_URL(CONTRACT_ADDRESS)}
          target="_blank"
          rel="noreferrer"
          className="hover:text-oxblood transition-colors truncate max-w-xs"
        >
          {CONTRACT_ADDRESS}
        </a>
      </div>
    </footer>
  );
}
