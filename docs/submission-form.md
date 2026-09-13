# ETHGlobal submission form — copy/paste

Category: **Artificial Intelligence**  ·  Emoji: **🧮** (or 🤖 / 📈)

---

## If you have a demonstration, link to it here

```
https://<your-ip-with-dashes>.sslip.io
```

See `deploy/README.md` — one `docker compose up` gives a public HTTPS link with no
domain and no testnet funds. Put the demo video URL here instead if the box is down.

---

## Short description (≤100 chars)

Pick one — all fit:

```
Startup fundraising where the investor is an AI agent bound by a human mandate.
```
(78)

```
Founders raise from AI agents that read on-chain data instead of a pitch deck.
```
(77)

```
Agents underwrite startups from live on-chain data, inside a mandate a human wrote.
```
(82)

---

## Description (min 280 chars)

```
AgentIPO is a fundraising platform where the investor is an AI agent, not a person.

A founder lists a startup: links, contracts, token, and the numbers only they have —
MRR, active users, runway. Those are published as a time series, never a single
figure, because "MRR $2,000" and "MRR $2,000, up $1,500 a month" are opposite
investments and a platform that cannot tell them apart is useless. Sensitive rows stay
gated: an agent can see that a metric exists but not its value, and has to ask. The
founder sees whose agent is asking and under what mandate before opening anything.

An investor never places a buy order. They write a mandate — thesis, sectors, minimum
diligence score, max ticket, per-round share, daily budget, risk tolerance — and the
agent acts only inside it. Press Run and the agent lives in the background: it watches
for rounds in its sectors, pulls live on-chain evidence indexed by The Graph, scores
seven diligence categories including growth-as-a-slope, applies the mandate gate, has
Claude return a structured verdict through forced tool-use, clamps it against the
spending policy, and settles USDC into a milestone escrow on Arc. Every step is
anchored on a Hedera Consensus Service topic, so a third party can audit why an agent
invested without trusting our database.

Agents come in two modes. An autonomous one settles its own tickets. An advisory one
does the identical research and files a proposal a human approves — and approving
re-runs the whole spending policy, because the world moves between the proposal and
the click.

Rounds sell equity, not a revenue share. A round sells a stake, which fixes the
valuation it was struck at, and capital comes back only on a liquidity event:
acquisition, IPO, TGE or a contract payout. Whoever settles the exit pays proceeds
into the escrow and every investor claims pro-rata, uncapped. An exit also freezes the
milestone schedule, so escrow the founder never drew down returns to investors instead
of being stranded in the contract.

The sharpest demonstration is two startups side by side: the one with more revenue
scores worse, because it has not moved in five months, and the platform says so.
```

---

## How it's made (min 280 chars)

```
pnpm monorepo: NestJS 11 API, Next.js 16 dashboard, a zod contract package shared by
both, and Foundry contracts. Every module is ports & adapters, every source file is
capped at 100 lines by ESLint and a CI script, and the domain layer — evaluators,
mandate gate, spending policy, approval policy, growth math — is framework-free pure
functions with Vitest specs.

The Graph is load-bearing, not decorative: agents cannot decide without it. Three Graph
products compose in one pipeline — the Token API for holders, top-10 concentration,
30-day transfers and treasury stables; a Messari standardized DEX subgraph so one query
works against any DEX by swapping the subgraph id; and the Agent0 / ERC-8004 subgraph,
whose reputation for the agent's own identity is fed back into its decision prompt.
Every signal carries a provenance badge in the UI, and fixtures are labelled as
fixtures rather than passed off as live.

Arc is where money moves. RoundEscrow.sol (Solidity 0.8.24, 52 Foundry tests) is a
milestone escrow settled in USDC — which on Arc is the native gas token, so the same
asset pays fees and fills the round. createRound sells equityBps; invest is
target-or-refund; releaseMilestone pays tranches; settleExit(kind, valuation,
proceeds, evidenceUri) pays a liquidity event into the claim pool, callable only by the
platform or the round's founder. Claims are floored per investor so the sum can never
exceed the pool. Agents hold their own wallets — HD-derived from one mnemonic, or
Circle developer-controlled wallets on ARC-TESTNET behind the same SettlementRail port.

Hedera carries the audit trail: data access requested and granted, decision made,
approval, settlement, exit, claim — each written to an HCS topic with sequence numbers.
Agents also get their own Hedera accounts and ERC-8004 identities.

Two decisions worth naming. First, we removed our own x402 paywall on the diligence
report. Charging agents to read public on-chain evidence is the wrong product, and it
broke every run without Hedera keys; x402 survives as an opt-in flag
(X402_GATE_REPORTS), with the real scarcity moved where it belongs — the founder's
private numbers, gated by the founder and opened per agent. Second, missing data is
never zero: a withheld metric, an unreadable index and a single reading with no
trajectory all land as "unknown", which lowers the report's data coverage instead of
inventing a score. The mandate gate then refuses low-coverage rounds before any LLM
call or any signature.

Hacky bits worth mentioning: Prisma's engine binaries were blocked by our network, so
the whole app runs on Prisma 7 with the Rust-free @prisma/adapter-pg and hand-written,
transaction-safe migrations. For offline development and for the hosted demo we run a
local Arc stand-in — anvil on Arc's chain id with MockUSDC injected at Arc's native
USDC address — so the entire escrow lifecycle, including exits and claims, executes as
real EVM transactions with no testnet funds. Sign-in is Privy, and when no Privy app is
configured the same screens run on a local session that is labelled "demo" in the nav,
on the sign-in step and in the stored account record, so a screenshot can never imply a
verified login.
```

---

## GitHub Repositories

```
https://github.com/vadimkotv/desh
```

---

## Per-track notes

`docs/submission-notes.md` has what to write in each sponsor's own field (The Graph
×2, Hedera, Arc ×2) and where judges should look in the code.
