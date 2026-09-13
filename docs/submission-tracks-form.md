# ETHGlobal submission — per-prize fields

Three prizes selected: **The Graph $15k · Hedera $15k · Arc $10k**.

Each block below is ready to paste into that prize's row: *why you're applicable*,
*link to the line of code*, *how easy was the API (1–10)*, *feedback for the sponsor*.

## Get the links first — they do not exist yet

`origin/yevhen` on GitHub is still at `f1e644e`. None of this work is pushed, so
`ExitReturns.sol` is not on GitHub at all and `RoundEscrow.sol` / `prompt.builder.ts` are
an older version there with different line numbers. **Push the branch before you paste
any link into the form.**

Then run:

```bash
./scripts/submission-links.sh
```

It prints every link below pinned to the pushed commit, with line ranges resolved from
the code by anchor text rather than hard-coded — so they cannot drift when a file is
edited. It warns if the tree is dirty or the commit is not on a remote yet.

The `<sha>` in the blocks below is a placeholder; take the real URLs from the script.

---

# The Graph — $15,000

## Why you're applicable

```
The Graph is the only thing our agents can see with. An agent's investment decision is
built entirely from Graph data, and three different Graph products compose into one
pipeline: the Token API for holder counts, top-10 concentration, 30-day transfer
activity and treasury stablecoin balances; a Messari standardized DEX subgraph for
liquidity and 24h volume, where the same query works against any DEX because the schema
is standardized — swapping the subgraph id is the only change; and the Agent0 / ERC-8004
subgraph, which we use in an unusual direction: we read the agent's *own* on-chain
reputation and put it back into its decision prompt, so an agent knows its track record
is public before it commits capital.

Those signals are normalized into findings, scored across seven diligence categories,
gated against the investor's mandate, turned into a structured verdict by Claude, and
settled on-chain. Nothing is mocked: DEMO_SIGNALS exists for offline development, is off
by default, and every fixture is tagged "demo-fixture" in the UI so a screenshot can
never pass a fixture off as live data. Missing index data becomes an explicit "unknown"
that lowers the report's data coverage rather than a zero that quietly looks like a
fact.
```

## Link to the line of code

Primary (put this in the field):

```
https://github.com/vadimkotv/desh/blob/<sha>/apps/api/src/modules/data-room/infrastructure/graph-token-api/token-api.client.ts#L33-L40
```

The other two, worth listing at the end of the text box if it fits:

```
Messari standardized DEX subgraph:  apps/api/src/modules/data-room/infrastructure/graph-messari/messari-dex.provider.ts#L10-L49
Agent0 / ERC-8004 subgraph:         apps/api/src/modules/data-room/infrastructure/graph-agent0/agent0.client.ts#L39-L51
Reputation fed into the prompt:     apps/api/src/modules/agents/infrastructure/engines/prompt.builder.ts#L24-L25
```

## How easy (1–10)

**8** — the Token API was the fastest integration in the whole project; the friction was
all in discovery, not in the API itself.

## Additional feedback for the sponsor

```
The Token API was the fastest integration in this project — REST, a JWT from
thegraph.market, and useful data on the first call. Two things cost us time.

First, response field names are not consistent across endpoints: transfers came back
with the amount under a different key than the balances and holders endpoints use, so we
ended up typing the field as optional under both names and reading whichever is present.
A single documented response envelope, or just a note in the docs where they differ,
would remove that.

Second, network_id values are not discoverable from the docs — we found the right strings
by trial. A plain list of supported network_id values on the endpoint reference page
would fix it in one line of docs.

For the decentralized network, the hard part is not querying, it is finding the subgraph
id. We knew we wanted a Messari standardized DEX subgraph and an ERC-8004 / Agent0
subgraph, and still lost time locating current ids. A lookup by protocol or by standard
schema — "give me the standardized DEX subgraph for Uniswap v3 on mainnet" — would be
more valuable to us than any new query feature. The standardized schemas themselves are
excellent and under-sold: writing one query that runs against any DEX is the reason we
could ship this in a hackathon, and it deserves to be the headline rather than a detail.
```

---

# Hedera — $15,000

## Why you're applicable

```
Our platform lets AI agents invest real money in startups. The obvious question is why
anyone should believe an agent's reasoning afterwards — so the audit trail cannot live in
our database. Every consequential step is written to a Hedera Consensus Service topic
with its sequence number: data access requested by an agent, access granted by the
founder, decision made, human approval of an advisory proposal, settlement, exit and
claim. A third party can reconstruct why an agent invested without trusting us at all.

Agents are Hedera-native as well as EVM-native: each agent gets its own Hedera account
created from the same secp256k1 key as its EVM wallet, funded with HBAR for fees and USDC
for data purchases, with automatic token association enabled.

We also built the x402 payment rail on Hedera — @x402/hedera against the Blocky402
testnet facilitator, exact scheme, USDC or HBAR — where an agent signs a partially-signed
TransferTransaction with its own key and the facilitator co-signs and settles. It works,
and we deliberately turned it off by default. Charging agents to read public on-chain
evidence turned out to be the wrong product: what is actually scarce is the founder's
private numbers, so those are gated by the founder and opened per agent, and x402 stays
as an opt-in rail (X402_GATE_REPORTS) for a priced data room rather than a tollbooth we
own. We would rather report that honestly than demo a paywall we do not believe in.
```

## Link to the line of code

Primary (put this in the field):

```
https://github.com/vadimkotv/desh/blob/<sha>/apps/api/src/modules/audit/infrastructure/hcs.publisher.ts#L19-L29
```

Worth listing at the end of the text box if it fits:

```
Hedera account per agent:  apps/api/src/modules/agents/infrastructure/hedera/hedera-account.factory.ts#L22-L38
x402 priced route:         apps/api/src/modules/payments/infrastructure/x402/premium-routes.ts#L14-L22
x402 facilitator wiring:   apps/api/src/modules/payments/infrastructure/x402/x402-server.factory.ts#L26-L27
```

## How easy (1–10)

**7** — HCS itself is a 9; the ECDSA/alias account details and the x402 flow pulled the
average down.

## Additional feedback for the sponsor

```
HCS is the best primitive we used in this hackathon. Create a topic, submit a message,
get back a sequence number — an append-only audit log with no infrastructure and no
schema negotiation. We reached for it once and then used it for seven different event
types without touching the integration again. Keep it that simple.

Three points of friction, all fixable in docs.

The @hashgraph/sdk to @hiero-ledger/sdk rename makes searching painful: almost every
example, blog post and StackOverflow answer we found used the old package name, so we
could never tell whether a snippet was current or stale. A visible mapping note on the
new package would help more than it sounds.

Giving one agent a single key that works as both a Hedera account and an EVM wallet took
reading SDK source rather than docs. setKeyWithoutAlias versus the alias-creating path is
the exact decision an agent builder has to make, and it is not explained in the account
creation guide in those terms. Likewise setMaxAutomaticTokenAssociations(-1): a fresh
account silently cannot receive USDC without it, which is a footgun for anyone funding
agent wallets programmatically.

For x402 on Hedera, the partially-signed TransferTransaction and facilitator co-sign flow
needs one complete worked example — client signs, server 402s, facilitator settles, with
the actual transaction assembly shown. We got there, but from reading library code rather
than from a guide, and that is the step most teams will give up on.
```

---

# Arc — $10,000

## Why you're applicable

```
Arc is where the money actually moves. RoundEscrow.sol (Solidity 0.8.24, 52 Foundry
tests) is a milestone escrow settled in USDC — which on Arc is also the native gas token,
so the same asset pays the fees and fills the round. createRound sells equityBps, which
fixes the valuation the round was struck at; invest is target-or-refund; releaseMilestone
pays the founder in tranches; and settleExit(kind, valuation, proceeds, evidenceUri) pays
a liquidity event — acquisition, IPO, TGE or a contract payout — into a claim pool that
investors draw pro-rata, uncapped. An exit freezes the milestone schedule, so escrow the
founder never drew down returns to investors instead of being stranded in the contract.
Claims are floored per investor so the sum can never exceed the pool.

The agentic part is that no human places the order. An investor writes a mandate — thesis,
sectors, minimum diligence score, max ticket, per-round share, daily budget — and the
agent operates only inside it: live on-chain evidence, a diligence score, the mandate
gate, a structured Claude verdict, then a spending policy that clamps the amount before
anything is signed. Agents hold their own wallets, either HD-derived locally or Circle
developer-controlled wallets on ARC-TESTNET, both behind one SettlementRail port. Agents
also come in two modes: autonomous ones settle their own tickets, advisory ones do
identical research and file a proposal for a human — and approving re-runs the entire
spending policy, because the world moves between the proposal and the click.
```

## Link to the line of code

Primary (put this in the field):

```
https://github.com/vadimkotv/desh/blob/<sha>/packages/contracts/src/RoundEscrow.sol#L51-L62
```

Worth listing at the end of the text box if it fits:

```
Exit settlement + pro-rata claims:  packages/contracts/src/ExitReturns.sol#L24-L67
Agent settles USDC on Arc:          apps/api/src/modules/settlement/infrastructure/arc/local-key.settlement.ts#L21-L45
Arc chain definition:               apps/api/src/modules/settlement/infrastructure/arc/arc-chain.ts#L6-L14
Circle developer-controlled wallet: apps/api/src/modules/settlement/infrastructure/circle/circle-wallet.factory.ts#L16-L28
Spending policy that clamps it:     apps/api/src/modules/settlement/domain/spending-policy.ts
```

## How easy (1–10)

**8** — standard EVM tooling worked unchanged; the decimals trap and local development
are what cost us time.

## Additional feedback for the sponsor

```
USDC as the native gas token is the best design decision in Arc for an agentic app: an
agent needs one asset, funds one wallet, and never stalls mid-strategy because it holds
the investment token but not the fee token. Everything else — viem, Foundry, standard EVM
tooling — worked unchanged.

The one thing that cost us real time is the decimals split: USDC is 18 decimals natively
and 6 decimals through the ERC-20 interface at 0x3600...0000. That is a correct design,
but it is a silent 10^12 error for anyone who assumes one number, and we hit it. Please
put it in a boxed warning at the top of the docs, not in a paragraph — with a one-line
code example showing a gas-balance read and a token-balance read side by side.

The bigger ask is local development. There is no official local Arc node, so to build
offline and to host a demo without testnet funds we ended up running anvil on Arc's chain
id and injecting a MockUSDC bytecode at the native USDC address with anvil_setCode to
make the ERC-20 interface exist. It works and the whole escrow lifecycle executes as real
EVM transactions, but every team that needs it will reinvent it. An official
arc-devnet Docker image — right chain id, USDC precompile present, accounts pre-funded —
would be the single highest-leverage thing you could ship for hackathons, and it would
also let CI run against Arc semantics instead of plain anvil.

Smaller: testnet funding is a bottleneck for a multi-wallet app. Agentic apps create
wallets programmatically, so a faucet that funds one address at a time is the wrong
shape; a batch or programmatic faucet endpoint with a sane rate limit would fit the
use case much better.
```

---

## Before you submit

- **Push `yevhen` first.** Nothing here is on GitHub yet — links to unpushed code 404,
  and judges who clone the repo get your partner's version without exits, growth or
  approval modes.
- Get the URLs from `./scripts/submission-links.sh`, not from the `<sha>` placeholders.
- Open each link once in a browser — GitHub line anchors are easy to get wrong by one.
- The ratings above are my read of the friction we actually hit; adjust if yours differs.
  Do not give a 10 to all three — identical top scores read as unconsidered.
