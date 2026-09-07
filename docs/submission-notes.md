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

- **Live x402-gated service**: `GET /due-diligence/rounds/:id/premium`, priced in `payments/infrastructure/x402/premium-routes.ts`,
  settled by **Blocky402** (`X402_FACILITATOR_URL=https://api.testnet.blocky402.com`), Hedera `exact` scheme, USDC `0.0.429274` or HBAR.
- **Agent consuming it end-to-end**: `agents/application/acquire-report.step.ts` → `payments/infrastructure/x402/paid-fetch.factory.ts`
  (agent signs a partially-signed `TransferTransaction` with its own ECDSA key; facilitator co-signs and settles).
- **Bonus**: per-call metering (every report request is a fresh payment), HCS audit trail (`audit/infrastructure/hcs.publisher.ts`),
  ERC-8004 identity (`agents/infrastructure/erc8004/*`), each agent gets its own Hedera account (`hedera-account.factory.ts`).
- Demo video must show: 402 → signed payment → settled tx on HashScan → report delivered.

## Arc — Best Agentic Economy App with Circle Agent Stack, $1,667

- **Agents with wallets**: `LOCAL_KEY` (HD-derived) or `CIRCLE` (Circle developer-controlled wallet on `ARC-TESTNET`,
  `settlement/infrastructure/circle/*`). Wallet kind is a strategy behind `SettlementRail`.
- **Decision logic tied to real signals**: report → mandate gate → spending policy → Claude verdict → clamp.
- **Autonomous USDC settlement**: `RoundEscrow.invest` on Arc (USDC is the gas token; ERC-20 interface at `0x3600…0000`).
- Submit: architecture diagram (ARCHITECTURE.md mermaid), video, docs, repo.

## Arc — Best DeFi / Onchain Finance App, $1,667

- `packages/contracts/src/RoundEscrow.sol` + `RevenueShare.sol`: conditional USDC flows — target-or-refund, milestone-based
  release to the founder, and revenue-based repayment: `distribute()` routes revenue into the round, investors `claim()` pro-rata
  until `returnCapBps` (e.g. 1.5×) is reached, status → Repaid. 48 Foundry tests. Demo: `pnpm --filter @agentipo/api demo:flow`.
- Verified on Arcscan (see `packages/contracts/README.md`).

## Checklist before submitting

- [ ] Public repo, README with setup + payment flow (this repo).
- [ ] Demo video 2–4 min (Graph) / ≤ 5 min (Hedera), per `docs/demo-script.md`.
- [ ] Arc: architecture diagram + presentation slide with track designation.
- [ ] Hedera: HashScan links for a settled x402 payment and the HCS topic.
- [ ] Graph: mention which Token API / subgraph ids are queried (from `.env`).
- [ ] Honest commit history — no single-commit final-day dump.
