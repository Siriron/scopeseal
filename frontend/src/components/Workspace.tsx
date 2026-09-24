import { useState } from "react";
import { RegisterPanel } from "./RegisterPanel";
import { DeclarePanel } from "./DeclarePanel";
import { CheckPanel } from "./CheckPanel";
import { LookupPanel } from "./LookupPanel";

type Tab = "lookup" | "register" | "declare" | "check";

const TABS: { id: Tab; label: string }[] = [
  { id: "lookup", label: "look up a package" },
  { id: "register", label: "1. set a ceiling" },
  { id: "declare", label: "2. declare a release" },
  { id: "check", label: "3. run a check" },
];

export function Workspace() {
  const [tab, setTab] = useState<Tab>("lookup");

  return (
    <section className="max-w-5xl mx-auto px-6 pb-24">
      <div className="border border-ink/20 bg-parchmentdark/40">
        <div className="flex flex-wrap border-b border-ink/20">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`font-mono text-xs px-5 py-3.5 border-r border-ink/10 last:border-r-0 transition-colors ${
                tab === t.id
                  ? "bg-parchment text-ink"
                  : "text-slate hover:text-ink hover:bg-parchment/50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="p-6 sm:p-8">
          {tab === "lookup" && <LookupPanel />}
          {tab === "register" && <RegisterPanel />}
          {tab === "declare" && <DeclarePanel />}
          {tab === "check" && <CheckPanel />}
        </div>
      </div>
    </section>
  );
}
