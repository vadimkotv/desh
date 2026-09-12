# Submission notes per track

All tracks share one repo, one architecture diagram (`ARCHITECTURE.md`) and one demo video.
Below: what to write in each sponsor's submission field and where judges should look.

## The Graph — Best AI Use Case (From Scratch), $5k

- **Load-bearing**: agents cannot decide without Graph data. `apps/api/src/modules/data-room/infrastructure/graph-*`
  are the only signal sources in production mode; `due-diligence/domain/evaluators/*` turn them into findings;
  `agents/infrastructure/engines/llm.decision-engine.ts` reasons over them.
- **Live data**: Token API (`token-api.thegraph.com`, JWT from thegraph.market) and Graph Network gateway
  (`gateway.thegraph.com/api/<key>/subgraphs/id/...`). No mocked datasets — `DEMO_SIGNALS` exists only for
  offline dev and is off by default; every fixture signal is tagged `demo-fixture`.
- **Meaningful work beyond query results**: normalization → scoring → mandate gating → structured LLM verdict
  → on-chain settlement.

## The Graph — Composable / Standardized, $5k

Three Graph products composed in one pipeline:

| Product | File | Standard leveraged |
| --- | --- | --- |
| Token API | `graph-token-api/token-api.provider.ts` | REST over Substreams-built token data |
| Messari standardized DEX subgraph | `graph-messari/messari-dex.provider.ts` | `liquidityPools` / `dailySnapshots` — same query works on any DEX subgraph, swap the id |
| Agent0 / ERC-8004 subgraphs | `graph-agent0/agent0.client.ts` | unified cross-chain agent identity + reputation schema |

The agent's *own* ERC-8004 reputation (read from the Agent0 subgraph) is fed back into its decision prompt.

## Hedera — AI & Agentic Payments, $2k × 3

- **HCS audit trail is the load-bearing piece**: every consequential step — data access requested and
  granted, decision made, approval, settlement, exit, claim — is written to a Hedera Consensus Service
  topic with sequence numbers (`audit/infrastructure/hcs.publisher.ts`). A third party can audit *why*
  an agent invested without trusting our database.
- **Agent identity**: each agent gets its own Hedera account (`hedera-account.factory.ts`) and an
  ERC-8004 identity (`agents/infrastructure/erc8004/*`) whose reputation is read back from the Agent0
  subgraph and fed into its own decision prompt.
- **x402 rail, opt-in**: `X402_GATE_REPORTS=true` prices `GET /due-diligence/rounds/:id/premium`
  (`payments/infrastructure/x402/premium-routes.ts`) and settles it through **Blocky402**, Hedera
  `exact` scheme, USDC `0.0.429274` or HBAR. The agent signs a partially-signed `TransferTransaction`
  with its own ECDSA key (`payments/infrastructure/x402/paid-fetch.factory.ts`); the facilitator
  co-signs and settles.
- **Why it is off by default — say this out loud in the submission**: the platform selling its own
  research is the wrong product. Public on-chain evidence is free to read; what is scarce is the
  *founder's* private numbers, and those are gated by the founder and opened per agent. x402 remains
  the rail for a priced data room, not a tollbooth the platform owns.
- Demo video, if showing the paid path: 402 → signed payment → settled tx on HashScan → report.

## Arc — Best Agentic Economy App with Circle Agent Stack, $1,667

- **Agents with wallets**: `LOCAL_KEY` (HD-derived) or `CIRCLE` (Circle developer-controlled wallet on `ARC-TESTNET`,
  `settlement/infrastructure/circle/*`). Wallet kind is a strategy behind `SettlementRail`.
- **Decision logic tied to real signals**: report → mandate gate → spending policy → Claude verdict → clamp.
- **Human in the loop where it belongs**: an agent is `AUTONOMOUS` or `ADVISORY`. Advisory agents do the
  identical research and file a proposal; approving re-runs the spending policy before anything settles,
  and both paths converge on the same settlement step.
- **Autonomous USDC settlement**: `RoundEscrow.invest` on Arc (USDC is the gas token; ERC-20 interface at `0x3600…0000`).
- Submit: architecture diagram (ARCHITECTURE.md mermaid), video, docs, repo.

## Arc — Best DeFi / Onchain Finance App, $1,667

- `packages/contracts/src/RoundEscrow.sol` + `ExitReturns.sol`: conditional USDC flows — target-or-refund,
  milestone-based release to the founder, and an **equity payout on a liquidity event**: a round sells
  `equityBps` (fixing the valuation at `raised × 10 000 / equityBps`), and `settleExit(roundId, kind,
  valuation, proceeds, evidenceUri)` pays acquisition / IPO / TGE / contract proceeds into the escrow
  for investors to `claim()` pro-rata, uncapped. An exit freezes the milestone schedule, so escrow the
  founder never drew down returns to investors instead of stranding. 52 Foundry tests.
  Demo: `pnpm --filter @agentipo/api demo:flow`.
- Verified on Arcscan (see `packages/contracts/README.md`).

## Checklist before submitting

- [ ] Public repo, README with setup + payment flow (this repo).
- [ ] Demo video 2–4 min (Graph) / ≤ 5 min (Hedera), per `docs/demo-script.md`.
- [ ] Arc: architecture diagram + presentation slide with track designation.
- [ ] Hedera: HashScan links for a settled x402 payment and the HCS topic.
- [ ] Graph: mention which Token API / subgraph ids are queried (from `.env`).
- [ ] Honest commit history — no single-commit final-day dump.
