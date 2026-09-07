#!/usr/bin/env bash
# Local Arc stand-in for end-to-end development without testnet funds.
#   1. anvil --chain-id 5042002 &          (Arc testnet chain id)
#   2. bash scripts/dev-arc-fork.sh        (from packages/contracts)
# Deploys MockUSDC, copies its bytecode to Arc's native USDC address (0x3600…0000),
# mints USDC to the first agent wallets of the default test mnemonic, deploys RoundEscrow.
# Prints the env lines to paste into apps/api/.env.
set -euo pipefail
RPC="${RPC:-http://127.0.0.1:8545}"
MNEMONIC="${MNEMONIC:-test test test test test test test test test test test junk}"
USDC=0x3600000000000000000000000000000000000000
PK0=$(cast wallet private-key --mnemonic "$MNEMONIC" --mnemonic-index 0)
PLATFORM=$(cast wallet address --private-key "$PK0")

MOCK=$(forge create --rpc-url "$RPC" --private-key "$PK0" --broadcast src/test/MockUSDC.sol:MockUSDC | awk '/Deployed to/ {print $3}')
cast rpc anvil_setCode "$USDC" "$(cast code "$MOCK" --rpc-url "$RPC")" --rpc-url "$RPC" >/dev/null
# platform wallet (index 0) also holds USDC: it routes demo revenue into rounds
cast send "$USDC" "mint(address,uint256)" "$PLATFORM" 100000000000 --rpc-url "$RPC" --private-key "$PK0" >/dev/null
for i in 1 2 3 4 5; do
  AGENT=$(cast wallet address --mnemonic "$MNEMONIC" --mnemonic-index "$i")
  cast send "$USDC" "mint(address,uint256)" "$AGENT" 5000000000 --rpc-url "$RPC" --private-key "$PK0" >/dev/null
done
ESCROW=$(forge create --rpc-url "$RPC" --private-key "$PK0" --broadcast src/RoundEscrow.sol:RoundEscrow \
  --constructor-args "$USDC" "$PLATFORM" | awk '/Deployed to/ {print $3}')

echo "# paste into apps/api/.env"
echo "ARC_RPC_URL=$RPC"
echo "ARC_ESCROW_ADDRESS=$ESCROW"
echo "ARC_PLATFORM_PRIVATE_KEY=$PK0"
echo "AGENT_MASTER_MNEMONIC=\"$MNEMONIC\""
echo "# platform wallet holds 100000 test USDC, agent wallets 1..5 each hold 5000"
