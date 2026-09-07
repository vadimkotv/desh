import type { AgentRecord } from '../../domain/agent.repository';

// ERC-8004 registration file ("agent card"). Served by GET /agents/:id/card and referenced
// as the agentURI on-chain, so the Agent0 subgraph can parse name/description/endpoints.
export function buildAgentCard(agent: AgentRecord, apiPublicUrl: string) {
  return {
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name: agent.name,
    description: `AgentIPO investor agent. Thesis: ${agent.mandate.thesis}`,
    image: `${apiPublicUrl}/agents/${agent.id}/avatar.svg`,
    services: [
      { name: 'web', endpoint: `${apiPublicUrl}/agents/${agent.id}` },
      { name: 'agentipo-decisions', endpoint: `${apiPublicUrl}/agents/${agent.id}/decisions` },
    ],
    x402Support: true,
    active: true,
    supportedTrust: ['reputation'],
    agentWallet: agent.walletAddress,
    hederaAccountId: agent.hederaAccountId,
    mandate: {
      sectors: agent.mandate.sectors,
      riskTolerance: agent.mandate.riskTolerance,
      maxTicketUsdc: agent.mandate.maxTicketUsdc,
    },
  };
}
