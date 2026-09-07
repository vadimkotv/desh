# @agentipo/contracts

Foundry package for **`RoundEscrow`** — a milestone escrow for startup fundraising rounds
settled in USDC on [Arc testnet](https://testnet.arcscan.app).

## How it works

1. The **platform** (AgentIPO API) calls `createRound(founder, target, deadline, milestoneBps)`.
   Milestones are basis-point tranches summing to `10_000` (1–20 entries).
2. Anyone (investor agents) calls `invest(roundId, amount)` after approving USDC. Oversubscription is allowed.
3. Anyone calls `finalize(roundId)` once `raised >= target` **or** the deadline passed:
   - `Funded` → the platform calls `releaseMilestone(roundId)` per tranche (`raised * bps / 10_000` to the founder);
     after the last tranche the round becomes `Closed`.
   - `Failed` → each investor calls `refund(roundId)` to get their contribution back.

```
src/RoundTypes.sol       enum, struct, events, errors (library)
src/IRoundEscrow.sol     public interface (extends IOperated)
src/Operated.sol         minimal "platform" operator mixin + IOperated
src/RoundEscrowBase.sol  storage, views, validation helpers
src/RoundEscrow.sol      state-changing logic (CEI + ReentrancyGuard)
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
cast send $ESCROW "createRound(address,uint256,uint64,uint16[])" $FOUNDER 100000000 $(( $(date +%s) + 604800 )) "[4000,3000,3000]" --rpc-url $RPC --private-key $PK
cast send 0x3600000000000000000000000000000000000000 "approve(address,uint256)" $ESCROW 100000000 --rpc-url $RPC --private-key $PK
cast send $ESCROW "invest(uint256,uint256)" 1 100000000 --rpc-url $RPC --private-key $PK
cast send $ESCROW "finalize(uint256)" 1 --rpc-url $RPC --private-key $PK
cast call $ESCROW "getRound(uint256)((address,uint256,uint256,uint64,uint8,uint16))" 1 --rpc-url $RPC
```
