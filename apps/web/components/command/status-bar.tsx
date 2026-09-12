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
        Investing run by AI agents: x402 data on Hedera, Graph-indexed signals and USDC escrow on Arc
      </p>
    </div>
  );
}
