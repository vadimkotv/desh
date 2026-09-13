#!/usr/bin/env bash
# Prints the per-prize code links for the ETHGlobal form, pinned to the pushed commit.
# Run it AFTER `git push origin yevhen`, from the repo root.
#
#   ./scripts/submission-links.sh
#
# Every range is resolved from the working tree, so the line numbers can never drift
# out of sync with the doc the way hand-written ones do.
set -euo pipefail

REPO="https://github.com/vadimkotv/desh"
SHA="$(git rev-parse HEAD)"

if [ -n "$(git status --porcelain)" ]; then
  echo "warning: working tree is dirty — links will point at the last commit, not your edits" >&2
fi
if ! git merge-base --is-ancestor "$SHA" "$(git rev-parse --verify --quiet origin/yevhen || echo "$SHA")" 2>/dev/null; then
  if ! git branch -r --contains "$SHA" 2>/dev/null | grep -q .; then
    echo "warning: $SHA is not on any remote branch yet — push first or these links will 404" >&2
  fi
fi

# Resolve a line range by anchoring on text instead of hard-coded numbers.
# usage: link <file> <start-regex> <line-count>
link() {
  local file="$1" anchor="$2" span="$3" start
  if [ ! -f "$file" ]; then echo "  MISSING  $file" >&2; return; fi
  start="$(grep -n -m1 -E "$anchor" "$file" | cut -d: -f1)"
  if [ -z "$start" ]; then echo "  NO MATCH ($anchor) in $file" >&2; return; fi
  echo "$REPO/blob/$SHA/$file#L$start-L$((start + span - 1))"
}

echo "commit: $SHA"
echo
echo "── The Graph ─────────────────────────────────────────────"
echo "primary (Token API request):"
link apps/api/src/modules/data-room/infrastructure/graph-token-api/token-api.client.ts \
     'private async get<T>' 8
echo "Messari standardized DEX subgraph:"
link apps/api/src/modules/data-room/infrastructure/graph-messari/messari-dex.provider.ts \
     '^const POOLS_QUERY' 40
echo "Agent0 / ERC-8004 subgraph:"
link apps/api/src/modules/data-room/infrastructure/graph-agent0/agent0.client.ts \
     'async agentsOwnedBy' 13
echo "reputation fed back into the prompt:"
link apps/api/src/modules/agents/infrastructure/engines/prompt.builder.ts \
     'Your own ERC-8004 reputation' 2

echo
echo "── Hedera ────────────────────────────────────────────────"
echo "primary (HCS topic submit):"
link apps/api/src/modules/audit/infrastructure/hcs.publisher.ts \
     'async publish\(message' 11
echo "Hedera account per agent:"
link apps/api/src/modules/agents/infrastructure/hedera/hedera-account.factory.ts \
     'async create\(privateKeyHex' 17
echo "x402 priced route:"
link apps/api/src/modules/payments/infrastructure/x402/premium-routes.ts \
     '^  return \{' 9
echo "x402 facilitator wiring:"
link apps/api/src/modules/payments/infrastructure/x402/x402-server.factory.ts \
     'new HTTPFacilitatorClient' 2

echo
echo "── Arc ───────────────────────────────────────────────────"
echo "primary (invest in USDC on Arc):"
link packages/contracts/src/RoundEscrow.sol \
     'function invest\(' 12
echo "exit settlement + pro-rata claims:"
link packages/contracts/src/ExitReturns.sol \
     'function settleExit\(' 44
echo "agent settles USDC on Arc:"
link apps/api/src/modules/settlement/infrastructure/arc/local-key.settlement.ts \
     'async invest\(\{' 25
echo "Arc chain definition:"
link apps/api/src/modules/settlement/infrastructure/arc/arc-chain.ts \
     '^export const arcTestnet' 9
echo "Circle developer-controlled wallet:"
link apps/api/src/modules/settlement/infrastructure/circle/circle-wallet.factory.ts \
     'async create\(agentName' 13
