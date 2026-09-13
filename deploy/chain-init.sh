#!/usr/bin/env bash
# Brings the local Arc stand-in up to a state the API can use: MockUSDC placed at Arc's
# native USDC address, RoundEscrow deployed, and every wallet funded with USDC and gas.
# Idempotent — re-running it against an initialised chain exits immediately.
set -euo pipefail

RPC="${ARC_RPC_URL:-http://anvil:8545}"
MNEMONIC="${AGENT_MASTER_MNEMONIC:?AGENT_MASTER_MNEMONIC is required}"
USDC=0x3600000000000000000000000000000000000000
STATE=/chain/escrow-address
WORK=/tmp/contracts

echo "waiting for $RPC …"
until cast block-number --rpc-url "$RPC" >/dev/null 2>&1; do sleep 1; done

if [ -s "$STATE" ] && [ "$(cast code "$(cat "$STATE")" --rpc-url "$RPC")" != "0x" ]; then
  echo "escrow already deployed at $(cat "$STATE")"
  exit 0
fi

# The contracts are mounted read-only and `lib/` is git-ignored, so work on a copy and
# fetch the two pinned dependencies there.
rm -rf "$WORK" && cp -r /contracts "$WORK" && cd "$WORK"
if [ ! -d lib/forge-std ]; then
  git clone --depth 1 --branch v5.1.0 -q https://github.com/OpenZeppelin/openzeppelin-contracts lib/openzeppelin-contracts
  git clone --depth 1 --branch v1.9.6 -q https://github.com/foundry-rs/forge-std lib/forge-std
fi
forge build >/dev/null

PK0=$(cast wallet private-key --mnemonic "$MNEMONIC" --mnemonic-index 0)
PLATFORM=$(cast wallet address --private-key "$PK0")

MOCK=$(forge create --rpc-url "$RPC" --private-key "$PK0" --broadcast \
  src/test/MockUSDC.sol:MockUSDC | awk '/Deployed to/ {print $3}')
cast rpc anvil_setCode "$USDC" "$(cast code "$MOCK" --rpc-url "$RPC")" --rpc-url "$RPC" >/dev/null

# The platform wallet settles exits, so it needs a large balance of its own.
cast send "$USDC" "mint(address,uint256)" "$PLATFORM" 100000000000 \
  --rpc-url "$RPC" --private-key "$PK0" >/dev/null

# Agent key indexes climb with every reseed, so fund a wide range — and fund gas too,
# because past anvil's ten pre-funded accounts a wallet has no native balance at all
# and every settlement reverts with "gas required exceeds allowance: 0".
for i in $(seq 1 24); do
  AGENT=$(cast wallet address --mnemonic "$MNEMONIC" --mnemonic-index "$i")
  cast send "$USDC" "mint(address,uint256)" "$AGENT" 5000000000 --rpc-url "$RPC" --private-key "$PK0" >/dev/null
  cast send "$AGENT" --value 100000000000000000 --rpc-url "$RPC" --private-key "$PK0" >/dev/null
done

ESCROW=$(forge create --rpc-url "$RPC" --private-key "$PK0" --broadcast \
  src/RoundEscrow.sol:RoundEscrow --constructor-args "$USDC" "$PLATFORM" \
  | awk '/Deployed to/ {print $3}')

mkdir -p "$(dirname "$STATE")"
printf '%s' "$ESCROW" > "$STATE"
echo "RoundEscrow deployed at $ESCROW"
