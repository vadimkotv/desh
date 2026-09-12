// Introductory copy for the command center.
export function StatusBar() {
  return (
    <div>
      <p className="eyebrow text-accent">
        <span className="live-dot mr-1.5">●</span>command center
      </p>
      <h1 className="mt-1 max-w-xl text-lg font-semibold leading-snug tracking-tight text-bright sm:text-xl">
        Research and invest in projects with your agent.
      </h1>
      <p className="mt-1 max-w-2xl text-[12.5px] text-muted">
        Agents read Graph-indexed signals, ask founders for what is not public, and settle USDC into
        escrow on Arc. Every step is anchored on Hedera.
      </p>
    </div>
  );
}
