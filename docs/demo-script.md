# Demo script (target: 3–4 minutes)

## 0. Setup before recording

- `.env` with Graph JWT + gateway key, Arc escrow deployed, Hedera operator + payTo, Anthropic key.
- `pnpm db:seed`, `pnpm dev`, dashboard open at `/`.
- One agent created (`/agents` → Create) — creation already provisioned its Arc wallet and Hedera account;
  fund the Arc wallet with testnet USDC from https://faucet.circle.com.
- Optional: `POST /agents/:id/identity` so the agent has an ERC-8004 id (shows as a badge).

## 1. The problem (20s)

"Fundraising runs on decks and trust. On-chain startups already have verifiable data — nobody reads it.
AgentIPO turns the investor into an agent that *has* to read it, bounded by a human mandate."

## 2. Founder side (40s) — `/rounds/:id`

- Show the round: target, milestones, on-chain escrow panel (Arc explorer link).
- Click **Refresh data room** → signals table fills from The Graph: Token API (holders, top-10
  concentration, 30-day transfers, treasury stables), Messari standardized DEX (liquidity/volume),
  Agent0 (founder reputation). Point at the `source` badges.
- Click **Generate report** → score gauge + coverage + summary. "Free tier is score + summary.
  The full report is x402-gated."

## 3. Agent side (90s) — `/agents/:id`

- Show the mandate card: thesis, sectors, min score, max ticket, daily budget, risk tolerance.
- Click **Run agent**. Narrate the pipeline as decisions appear:
  1. *Buys* the premium report — `dataPaymentTxId` links to HashScan (USDC on Hedera testnet via Blocky402).
  2. *Gates* on the mandate (coverage + min score).
  3. *Spending policy* computes the USDC ceiling (max ticket, per-round share, daily budget, wallet balance).
  4. *Claude* returns a structured verdict via forced tool-use — read the reasoning + key risks.
  5. *Settles* — `RoundEscrow.invest` on Arc; tx link on Arcscan.
- Open `/audit`: every step is on an HCS topic with sequence numbers — link to HashScan topic.

## 3b. The money comes back (30s) — `/rounds/:id`

- Operator panel: **Finalize** (target met → Funded), **Release milestone** ×2 (Closed), **Distribute revenue**.
- Returns panel fills: cap meter climbs to 100%, status → REPAID; press **Claim** on an agent row → Arc tx, claimed/expected bar.
- "No token, no exit needed: revenue-based financing where the covenant is a contract."

## 4. Why this is infrastructure (30s)

- Any agent can consume the data room: it's an HTTP endpoint priced per query (x402), listed
  with `serviceName`/`tags` for discovery.
- Mandate is the only human input; policy is enforced in code before any signature.
- Milestone escrow: capital is released as the startup delivers, refund if the round fails.

## 5. Close (10s)

Repo, architecture diagram, tracks: The Graph (AI use case + composable/standardized), Arc
(agentic economy + programmable money), Hedera (agentic payments + HCS + ERC-8004).
