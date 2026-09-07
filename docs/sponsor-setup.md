# Sponsor setup — getting every key

## The Graph
1. **Token API JWT**: https://thegraph.market → sign in → API tokens → create. Put in `GRAPH_TOKEN_API_JWT`.
   Endpoints used: `/balances/evm/{address}`, `/holders/evm/{contract}`, `/transfers/evm?contract=…&age=30`.
2. **Gateway API key**: https://thegraph.com/studio → API keys. Put in `GRAPH_GATEWAY_API_KEY`.
3. **Messari DEX subgraph id**: https://thegraph.com/explorer → search "uniswap v3 ethereum messari" (or any
   DEX with the standardized schema) → copy the Subgraph ID → `GRAPH_MESSARI_DEX_SUBGRAPH_ID`.
4. Agent0 subgraph ids are in `packages/shared/src/chains.ts` (Sepolia default; Base Sepolia available).

## Arc (Circle)
1. Wallet + faucet: https://faucet.circle.com → "Arc Testnet" → USDC to the platform key address.
2. Deploy escrow: `cd packages/contracts && PLATFORM_ADDRESS=<platform addr> pnpm deploy:arc` (needs
   `DEPLOYER_PRIVATE_KEY`; USDC is the gas token). Put the address in `ARC_ESCROW_ADDRESS`.
3. `ARC_PLATFORM_PRIVATE_KEY` = the deployer/platform key (creates rounds, releases milestones).
4. Fund each agent wallet (address shown on `/agents`) with testnet USDC from the same faucet.
5. Optional Circle Agent Stack wallets: https://console.circle.com → API key + entity secret + wallet set
   → `CIRCLE_API_KEY`, `CIRCLE_ENTITY_SECRET`, `CIRCLE_WALLET_SET_ID`. Create agents with `walletKind: CIRCLE`.

## Hedera
1. Operator account: https://portal.hedera.com → testnet → ECDSA account. `HEDERA_OPERATOR_ID`, `HEDERA_OPERATOR_KEY` (0x-hex).
2. Associate + fund USDC on the operator: https://faucet.circle.com → "Hedera Testnet" (token `0.0.429274`).
   The API funds each new agent with `AGENT_HEDERA_INITIAL_USDC` from the operator.
3. `HEDERA_PAYTO_ACCOUNT_ID` = operator (or any account associated with USDC) — receives x402 payments.
4. Blocky402: hosted testnet facilitator `https://api.testnet.blocky402.com` (default). Self-host: https://github.com/blockydevs/blocky402.
5. HCS: leave `HEDERA_HCS_TOPIC_ID` empty; the first audit write creates a topic and logs its id — pin it afterwards.

## ERC-8004 (Sepolia)
- Agent wallets need a little Sepolia ETH to call `register()` (same address as the Arc wallet).
- `POST /agents/:id/identity` registers with `agentURI = ${API_PUBLIC_URL}/agents/:id/card`; make `API_PUBLIC_URL`
  publicly reachable (e.g. an ngrok/cloudflared tunnel) so the Agent0 subgraph can parse the card.

## Anthropic
- `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (default `claude-sonnet-4-5`). `DECISION_ENGINE=rules` forces the deterministic engine.
