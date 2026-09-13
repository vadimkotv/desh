# ETHGlobal submission — Tech Stack section

Every item below is actually in the repository. Where a dropdown has no matching
option, the fallback is the free-text "other technologies" box at the bottom.

---

## Ethereum developer tools

```
Foundry
viem
OpenZeppelin Contracts
The Graph
Anvil
```

- **Foundry** — `packages/contracts` (forge build/test, 52 tests, `forge script` deploy)
- **viem** — every chain read and write in the API (`apps/api/src/modules/settlement`)
- **OpenZeppelin Contracts v5.1.0** — `IERC20`, `SafeERC20`, `ReentrancyGuard`
- **The Graph** — Token API + two subgraphs, the only production signal source
- **Anvil** — the local Arc stand-in the demo and CI run against

*If "Anvil" is not its own option, drop it — it is part of Foundry.*

---

## Blockchain networks

```
Arc
Hedera
Ethereum Sepolia
Base Sepolia
Ethereum Mainnet
```

- **Arc testnet** (chain id `5042002`) — `RoundEscrow` settlement in USDC, which is also
  the native gas token
- **Hedera testnet** — HCS audit topic, agent accounts, and the x402 payment rail
- **Ethereum Sepolia** — ERC-8004 Identity Registry `0x8004A818BFB912233c491871b3d84c89A494BD9e`
- **Base Sepolia** — the alternate ERC-8004 / Agent0 subgraph deployment
- **Ethereum Mainnet** — read-only: the Graph Token API and Messari DEX subgraph index
  mainnet tokens and pools that the demo startups point at

---

## Programming languages

```
TypeScript
Solidity
SQL
Bash
```

Solidity `0.8.24`, evm_version `cancun`. SQL is the hand-written migrations; Bash is the
deploy and chain-init scripts. Drop the last two if the list is meant to be short.

---

## Web frameworks

```
Next.js
React
NestJS
Express
Tailwind CSS
```

Next.js 16 (App Router, server components) · React 19 · NestJS 11 on Express 4 ·
Tailwind CSS 4.

---

## Databases

```
PostgreSQL
Prisma
```

PostgreSQL 16. Prisma 7 with the Rust-free `@prisma/adapter-pg` driver adapter — put it
under "other technologies" if Prisma is not listed as a database.

---

## Design tools

```
(none)
```

No Figma, no Sketch. The interface was built directly in code with Tailwind, and every
chart — radar, sparklines, rings, meters — is hand-written SVG with no charting library.
Pick "None" / "Other" and say exactly that; do not invent a tool you did not open.

---

## Other technologies (free text — type and press enter for each)

```
x402
Privy
Anthropic Claude API
ERC-8004
Hedera Consensus Service
Circle Developer-Controlled Wallets
Blocky402
The Graph Token API
Messari standardized subgraphs
Agent0
zod
Prisma
Server-Sent Events
Vitest
pnpm workspaces
Docker Compose
Caddy
```

---

## Describe how AI tools were used in your project

```
AI was used to build this project, and AI is also what the product does — worth
separating the two.

Building it. Claude Code (Claude Opus) did the bulk of the implementation, driven by us
in a long session: the ports-and-adapters layout of the NestJS API, the RoundEscrow /
ExitReturns Solidity contracts and their 52 Foundry tests, the Next.js dashboard
including every hand-written SVG chart, the Prisma schema and the hand-written
migrations, the Privy onboarding, and the Docker Compose deployment. It also did the
work we would have skipped under time pressure: running the full escrow lifecycle
against a local Arc fork and reading the failures. Two real bugs came out of that —
agent wallets past anvil's ten pre-funded accounts had no gas, so every settlement
reverted with "gas required exceeds allowance: 0", and an unreachable RPC was being
surfaced to the UI as a contract revert, which would have sent us hunting a contract
bug that did not exist.

OpenAI Codex (GPT-5.6) wrote the first version of the persistent agent runtime — the
background supervisor that keeps a RUNNING agent watching for new rounds. We reviewed
and reworked it: batching rounds per cycle instead of one, moving mandate eligibility
off the frontend onto the API so the dashboard cannot drift from what agents actually
do, and replacing a polling loop with the SSE stream the rest of the app already uses.

Every line was reviewed by us before merge, and the checks are not decorative: 52
Foundry tests, 28 Vitest specs, typecheck and lint on both apps, a 100-line-per-file
budget enforced in CI, and all eight migrations replayed in a single transaction
against a fresh database.

In the product. Claude is the decision engine: an agent's verdict comes back through
forced tool-use (submit_decision) as a structured action, amount, confidence, reasoning
and key risks, with the mandate, the diligence findings, the raw signals, the founder's
growth series and the agent's own ERC-8004 reputation in the prompt. It never sees an
amount it is not allowed to spend — the spending policy computes the ceiling before the
call and clamps the verdict again after. A deterministic rules engine implements the
same port, so the platform demos end-to-end with no API key.
```
