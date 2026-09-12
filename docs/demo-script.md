# Demo script (target: 3–4 minutes)

## 0. Setup before recording

- `.env` with Graph JWT + gateway key, Arc escrow deployed, Hedera operator, Anthropic key.
- `pnpm db:seed` (3 startups with deliberately different growth shapes + 4 agents), `pnpm dev`,
  dashboard open at `/`.
- On a local Arc fork: `pnpm --filter @agentipo/api dev:fund-agents` — agents need USDC *and* gas.
- Optional: `POST /agents/:id/identity` so an agent has an ERC-8004 id (shows as a badge).
- Leave every agent **paused** so the first Run is visible on camera.

## 1. The problem (20s)

"Fundraising runs on decks and trust. On-chain startups already have verifiable data — nobody reads
it. AgentIPO turns the investor into an agent that *has* to read it, bounded by a human mandate."

## 2. The number that lies (45s) — `/rounds/:id`

Open **Orbital Agents** and **Meridian Yield** side by side. Orbital's MRR is *higher*.

- Founder data room: metrics are published as **trajectories**, not levels. Meridian: `$4.8k, +$843/mo`.
  Orbital: `920 agents, +16/mo` — flat for five months.
- Reports: Meridian scores **72.5** with growth **strong 97**; Orbital scores **62.1** with growth
  **weak 9**. "The one with more revenue is the worse investment, and the platform says so."
- Ledgerline has a single reading: growth is **unknown**, and coverage drops to 0.64.
  "Missing data lowers confidence. It never becomes a zero."
- Point at the gated rows: `🔒 Net revenue`, `🔒 Runway`. "The founder publishes what they want.
  The platform does not sell access to any of it."

## 3. The agent asks, the founder opens (35s)

- Press **Run** on `Vanguard`. It starts watching in the background — the nav pill goes live.
- Its run hits the gated rows and files an access request. Scroll to **access requests**: the
  founder sees the agent's name, its owner's address and its mandate thesis.
- Press **Open data** → the series appears for *that* agent. Check another agent: still withheld.
  "Access is per agent. The founder is choosing who underwrites them."

## 4. Decision, and the human in the loop (60s)

- Watch the live pipeline (SSE): gather → mandate gate → spending policy → engine → settle.
  Claude returns a structured verdict through forced tool-use; read the reasoning and key risks.
- Three agents settle on their own — `RoundEscrow.invest` on Arc, tx links on Arcscan.
- `Atlas` is **✋ advisory**: identical research, but it stops. Go to `/` → **Needs your approval**.
  Read its proposal, press **Approve & invest**. "The mandate re-runs at approval time — budget,
  balance, round still open — then it settles."
- Open `/audit`: every step is on an HCS topic with sequence numbers.

## 5. The money comes back (35s) — `/rounds/:id`

- Operator panel: **Finalize** (target met → Funded), **Release milestone** ×2 (Closed).
- **Settle exit**: pick `Acquisition`, type the headline valuation. The panel shows what the round's
  stake actually converts to: `8% of $1.75M → $140k to these investors`.
- Returns panel: status **EXITED**, multiple **4.81x**. Press **Claim** on an agent row → Arc tx.
- "No revenue share and no repayment schedule. They bought equity; the exit paid it."

## 6. Why this is infrastructure (25s)

- The mandate is the only human input. Everything downstream is enforced in code before any signature.
- Two modes, one pipeline: an agent can be fully autonomous or advisory, and the settlement path is
  the same either way.
- Milestone escrow: capital is released as the startup delivers, refunded if the round fails, and an
  exit returns whatever the founder never drew down.

## 7. Close (10s)

Repo, architecture diagram, tracks: The Graph (AI use case + composable/standardized), Arc (agentic
economy + programmable money), Hedera (HCS audit + ERC-8004; x402 rail available via
`X402_GATE_REPORTS`).

---

**Fallback if anything is offline:** `pnpm --filter @agentipo/api demo:flow` runs the whole story in
one command against a local Arc fork — round → swarm → human approval → finalize → milestones →
acquisition → claims.
