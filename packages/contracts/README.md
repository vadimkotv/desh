# @agentipo/contracts

Foundry package for **`RoundEscrow`** — a milestone escrow for startup fundraising rounds
settled in USDC on [Arc testnet](https://testnet.arcscan.app).

## How it works

1. The **platform** (AgentIPO API) calls `createRound(founder, target, deadline, milestoneBps, returnCapBps)`.
   Milestones are basis-point tranches summing to `10_000` (1–20 entries); `returnCapBps` is the
   investor return cap (see [Revenue-share returns](#revenue-share-returns-rbf)).
2. Anyone (investor agents) calls `invest(roundId, amount)` after approving USDC. Oversubscription is allowed.
3. Anyone calls `finalize(roundId)` once `raised >= target` **or** the deadline passed:
   - `Funded` → the platform calls `releaseMilestone(roundId)` per tranche (`raised * bps / 10_000` to the founder);
     after the last tranche the round becomes `Closed`.
   - `Failed` → each investor calls `refund(roundId)` to get their contribution back.
4. Once `Funded`, revenue flows back to investors through `distribute` / `claim` until the return
   cap is reached, at which point the round becomes `Repaid`.

## Revenue-share returns (RBF)

Rounds are **revenue-based financing**: instead of equity, investors are owed a share of the
company's revenue until they have received a fixed multiple of what the round raised.

- **Return cap.** `returnCapBps` is fixed at creation, between `10_000` (1.0x) and `50_000` (5.0x),
  else `InvalidReturnCap()`. The USDC cap is `returnCapOf(roundId) = raised * returnCapBps / 10_000`
  (computed on `raised`, so oversubscription raises the cap proportionally).
- **`distribute(roundId, amount)`** — anyone (the founder or a revenue router) pushes `amount` USDC
  into the round after approving the escrow. Allowed while `Funded` or `Closed`; `amount > 0`;
  reverts with `ExceedsReturnCap()` if `distributed + amount` would exceed the cap.
  Emits `RevenueDistributed(roundId, from, amount, totalDistributed)`.
- **`claim(roundId)`** — an investor withdraws their outstanding share. Allowed while `Funded`,
  `Closed` or `Repaid`; reverts with `NothingToClaim()` when nothing is owed.
  Emits `Claimed(roundId, investor, amount)` and returns the amount.
- **Views.** `claimableOf(roundId, investor) = distributed * contribution / raised − claimedOf(...)`
  (0 while nothing was raised); `claimedOf(roundId, investor)` is the cumulative amount withdrawn.
  Shares are floored per investor, so the sum of claims never exceeds `distributed`; any sub-unit
  dust is picked up by later distributions.
- **`Repaid`.** The terminal status once **both** every milestone has been released **and**
  `distributed == returnCapOf(roundId)`. It is set by whichever of `distribute` / `releaseMilestone`
  completes the pair. No further distributions are accepted; claims remain open indefinitely.
  A `Funded` round that hits the cap stays `Funded` until the platform releases its last tranche.
- Failed rounds are untouched: `distribute` and `claim` revert with `InvalidStatus()` and `refund`
  works as before.

```
Open ──finalize (target met)──▶ Funded ──releaseMilestone × N──▶ Closed ──distribute (cap hit)──▶ Repaid
  │                               └──distribute (cap hit)──▶ Funded ──releaseMilestone (last)──▶ Repaid
  └──finalize (deadline passed)──▶ Failed ──refund──▶ investors get contributions back
```

```
src/RoundTypes.sol       enum, struct, events, errors (library)
src/IRevenueShare.sol    revenue-share interface (distribute / claim / views)
src/IRoundEscrow.sol     public interface (extends IOperated, IRevenueShare)
src/Operated.sol         minimal "platform" operator mixin + IOperated
src/RoundEscrowBase.sol  storage, views, validation helpers
src/RevenueShare.sol     revenue distribution + pro-rata claims (CEI + ReentrancyGuard)
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
cast send $ESCROW "createRound(address,uint256,uint64,uint16[],uint16)" $FOUNDER 100000000 $(( $(date +%s) + 604800 )) "[4000,3000,3000]" 15000 --rpc-url $RPC --private-key $PK
cast send 0x3600000000000000000000000000000000000000 "approve(address,uint256)" $ESCROW 100000000 --rpc-url $RPC --private-key $PK
cast send $ESCROW "invest(uint256,uint256)" 1 100000000 --rpc-url $RPC --private-key $PK
cast send $ESCROW "finalize(uint256)" 1 --rpc-url $RPC --private-key $PK
cast call $ESCROW "getRound(uint256)((address,uint256,uint256,uint64,uint8,uint16,uint16,uint256))" 1 --rpc-url $RPC
# after the round is Funded: push revenue in and claim it back
cast send 0x3600000000000000000000000000000000000000 "approve(address,uint256)" $ESCROW 10000000 --rpc-url $RPC --private-key $PK
cast send $ESCROW "distribute(uint256,uint256)" 1 10000000 --rpc-url $RPC --private-key $PK
cast call $ESCROW "claimableOf(uint256,address)(uint256)" 1 $INVESTOR --rpc-url $RPC
cast send $ESCROW "claim(uint256)" 1 --rpc-url $RPC --private-key $INVESTOR_PK
```

`getRound` returns `(founder, target, raised, deadline, status, releasedCount, returnCapBps, distributed)`
where `status` is `0 Open, 1 Funded, 2 Failed, 3 Closed, 4 Repaid`.
