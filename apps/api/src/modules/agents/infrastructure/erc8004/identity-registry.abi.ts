import { parseAbi } from 'viem';

// ERC-8004 Identity Registry (reference deployment, same address on Sepolia and Base Sepolia).
export const identityRegistryAbi = parseAbi([
  'function register(string agentURI) returns (uint256)',
  'function setAgentURI(uint256 agentId, string newURI)',
  'function setMetadata(uint256 agentId, string metadataKey, bytes metadataValue)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'event Registered(uint256 indexed agentId, string agentURI, address indexed owner)',
]);
