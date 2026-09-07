import { parseAbi } from 'viem';

// Subset of packages/contracts/abi/RoundEscrow.abi.json that the API actually calls.
export const roundEscrowAbi = parseAbi([
  'function createRound(address founder, uint256 target, uint64 deadline, uint16[] milestoneBps) returns (uint256)',
  'function invest(uint256 roundId, uint256 amount)',
  'function finalize(uint256 roundId)',
  'function releaseMilestone(uint256 roundId)',
  'function refund(uint256 roundId)',
  'function getRound(uint256 roundId) view returns ((address founder, uint256 target, uint256 raised, uint64 deadline, uint8 status, uint16 releasedCount))',
  'function getMilestones(uint256 roundId) view returns (uint16[])',
  'function contributionOf(uint256 roundId, address investor) view returns (uint256)',
  'function investorCountOf(uint256 roundId) view returns (uint256)',
  'function roundCount() view returns (uint256)',
  'function usdc() view returns (address)',
  'event RoundCreated(uint256 indexed roundId, address indexed founder, uint256 target, uint64 deadline)',
  'event Invested(uint256 indexed roundId, address indexed investor, uint256 amount, uint256 raised)',
]);

export const ONCHAIN_STATUS = ['Open', 'Funded', 'Failed', 'Closed'] as const;
