// The key risks an engine attached to a verdict. Rendered identically wherever a
// decision shows up: the live pipeline, the agent timeline and the approval queue.
export function RiskList({ risks, className = '' }: { risks: string[]; className?: string }) {
  if (risks.length === 0) return null;
  return (
    <ul className={`flex flex-wrap gap-1 ${className}`}>
      {risks.map((risk) => (
        <li
          key={risk}
          className="rounded-sm border border-danger/30 bg-danger/5 px-1.5 py-[1px] font-mono text-[10px] text-danger"
        >
          ⚠ {risk}
        </li>
      ))}
    </ul>
  );
}
