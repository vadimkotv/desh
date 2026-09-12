# @agentipo/contracts

Foundry package for **`RoundEscrow`** — a milestone escrow for startup fundraising rounds
settled in USDC on [Arc testnet](https://testnet.arcscan.app). Rounds sell equity and pay
investors back on a liquidity event — acquisition, IPO, TGE or contract payout.

## How it works

1. The **platform** (AgentIPO API) calls `createRound(founder, target, deadline, milestoneBps, equityBps)`.
   Milestones are basis-point tranches summing to `10_000` (1–20 entries); `equityBps` is the stake
   the round sells (see [Exit returns](#exit-returns)).
2. Anyone (investor agents) calls `invest(roundId, amount)` after approving USDC. Oversubscription is allowed.
3. Anyone calls `finalize(roundId)` once `raised >= target` **or** the deadline passed:
   - `Funded` → the platform calls `releaseMilestone(roundId)` per tranche (`raised * bps / 10_000` to the founder);
     after the last tranche the round becomes `Closed`.
   - `Failed` → each investor calls `refund(roundId)` to get their contribution back.
4. Capital comes back only when the startup has a **liquidity event**: `settleExit` pays proceeds
   into the round, the status becomes `Exited`, and investors `claim` their pro-rata share.

## Exit returns

Rounds sell **equity**, not a revenue stream. Investors are paid when — and only when — the
startup exits: an acquisition, an IPO, a token generation event, or a contract payout.

- **Stake sold.** `equityBps` is fixed at creation, between `10` (0.1%) and `5_000` (50%), else
  `InvalidEquity()`. It fixes the price of the round: `entryValuationOf(roundId) = raised * 10_000 / equityBps`
  (computed on `raised`, so oversubscription raises the valuation proportionally).
- **`settleExit(roundId, kind, valuation, proceeds, evidenceUri)`** — the platform **or** the round's
  founder pays `proceeds` USDC into the claim pool after approving the escrow; anyone else gets
  `NotAuthorized()`. `kind` is `0 Acquisition, 1 IPO, 2 TGE, 3 Contract`; `valuation` and `evidenceUri`
  record the headline number and the proof. Allowed while `Funded`, `Closed` or already `Exited`
  (follow-on tranches and earn-outs); `proceeds > 0`. There is **no cap** — an exit can return any
  multiple. Emits `ExitSettled(roundId, kind, valuation, proceeds, totalProceeds, evidenceUri)`.
- **Undrawn escrow.** The first settlement on a `Funded` round freezes the milestone schedule, so
  `raised − released` — money the founder never drew down — joins the claim pool instead of being
  stranded.
- **`claim(roundId)`** — an investor withdraws their outstanding share. Allowed unless the round is
  `Open` or `Failed`; reverts with `NothingToClaim()` when nothing is owed.
  Emits `Claimed(roundId, investor, amount)` and returns the amount.
- **Views.** `claimableOf(roundId, investor) = proceeds * contribution / raised − claimedOf(...)`
  (0 while nothing was raised); `claimedOf(roundId, investor)` is the cumulative amount withdrawn.
  Shares are floored per investor, so the sum of claims never exceeds the pool; any sub-unit dust is
  picked up by later settlements.
- Failed rounds are untouched: `settleExit` and `claim` revert with `InvalidStatus()` and `refund`
  works as before.

```
Open ──finalize (target met)──▶ Funded ──releaseMilestone × N──▶ Closed ──settleExit──▶ Exited
  │                               └──settleExit (undrawn escrow joins the pool)──▶ Exited
  └──finalize (deadline passed)──▶ Failed ──refund──▶ investors get contributions back
```

```
src/RoundTypes.sol       enums, struct, events, errors (library)
src/IExitReturns.sol     exit-returns interface (settleExit / claim / views)
src/IRoundEscrow.sol     public interface (extends IOperated, IExitReturns)
src/Operated.sol         minimal "platform" operator mixin + IOperated
src/RoundEscrowBase.sol  storage, views, validation helpers
src/ExitReturns.sol      exit settlement + pro-rata claims (CEI + ReentrancyGuard)
src/RoundEscrow.sol      round lifecycle logic (CEI + ReentrancyGuard)
src/test/MockUSDC.sol    6-decimal mintable ERC-20 for tests / local demos
script/Deploy.s.sol      deployment script
abi/RoundEscrow.abi.json exported ABI (consumed by apps/api, apps/web)
```

## Setup

`lib/` is git-ignored. Install the two dependencies at the pinned versions
(this folder is not its own git repo, so use plain `git clone`):

```bash
git clone --depth 1 --branch v5.1.0 https://github.com/OpenZeppelin/openzeppelin-contracts lib/openzeppelin-contracts
git clone --depth 1 --branch v1.9.6 https://github.com/foundry-rs/forge-std lib/forge-std
```

Remappings are committed in `remappings.txt`:

```
@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/
forge-std/=lib/forge-std/src/
```

(Alternatively `forge install OpenZeppelin/openzeppelin-contracts@v5.1.0 foundry-rs/forge-std@v1.9.6 --no-git`.)

## Build & test

```bash
pnpm build          # forge build
pnpm test           # forge test -vv
pnpm export-abi     # writes abi/RoundEscrow.abi.json from out/
```

## Deploy to Arc testnet

| | |
| --- | --- |
| Chain id | `5042002` |
| RPC | `https://rpc.testnet.arc.io` (configured as `arc_testnet` in `foundry.toml`) |
| Explorer | https://testnet.arcscan.app |
| Faucet | https://faucet.circle.com (select Arc Testnet) |
| USDC | `0x3600000000000000000000000000000000000000` (6 decimals) |

> **Note:** on Arc, **USDC is the native gas token**. Fund the deployer with USDC from the faucet;
> there is no separate ETH balance. The escrow still uses the ERC-20 interface of that same USDC.

```bash
export DEPLOYER_PRIVATE_KEY=0x...
export PLATFORM_ADDRESS=0x...       # operator (defaults to the deployer)
export USDC_ADDRESS=0x3600000000000000000000000000000000000000   # optional, this is the default
pnpm deploy:arc
```

The deployed address is printed by the script and written to `broadcast/Deploy.s.sol/5042002/run-latest.json`.
Put it in the API env as `ESCROW_ADDRESS`.

## Verify on Arcscan (Blockscout-style)

```bash
forge verify-contract <ESCROW_ADDRESS> src/RoundEscrow.sol:RoundEscrow \
  --chain-id 5042002 \
  --verifier blockscout \
  --verifier-url https://testnet.arcscan.app/api \
  --constructor-args $(cast abi-encode "constructor(address,address)" $USDC_ADDRESS $PLATFORM_ADDRESS)
```

## Quick manual round (cast)

```bash
export ESCROW=0x... RPC=https://rpc.testnet.arc.io PK=$DEPLOYER_PRIVATE_KEY
cast send $ESCROW "createRound(address,uint256,uint64,uint16[],uint16)" $FOUNDER 100000000 $(( $(date +%s) + 604800 )) "[4000,3000,3000]" 800 --rpc-url $RPC --private-key $PK
cast send 0x3600000000000000000000000000000000000000 "approve(address,uint256)" $ESCROW 100000000 --rpc-url $RPC --private-key $PK
cast send $ESCROW "invest(uint256,uint256)" 1 100000000 --rpc-url $RPC --private-key $PK
cast send $ESCROW "finalize(uint256)" 1 --rpc-url $RPC --private-key $PK
cast call $ESCROW "getRound(uint256)((address,uint256,uint256,uint64,uint8,uint16,uint16,uint256,uint256))" 1 --rpc-url $RPC
# after the round is Funded: settle an acquisition and claim the proceeds
cast send 0x3600000000000000000000000000000000000000 "approve(address,uint256)" $ESCROW 800000000 --rpc-url $RPC --private-key $PK
cast send $ESCROW "settleExit(uint256,uint8,uint256,uint256,string)" 1 0 10000000000 800000000 "https://example.com/press" --rpc-url $RPC --private-key $PK
cast call $ESCROW "claimableOf(uint256,address)(uint256)" 1 $INVESTOR --rpc-url $RPC
cast send $ESCROW "claim(uint256)" 1 --rpc-url $RPC --private-key $INVESTOR_PK
```

`getRound` returns `(founder, target, raised, deadline, status, releasedCount, equityBps, released, proceeds)`
where `status` is `0 Open, 1 Funded, 2 Failed, 3 Closed, 4 Exited`.
