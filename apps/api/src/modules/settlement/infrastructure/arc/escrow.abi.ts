import { parseAbi } from 'viem';

// Subset of packages/contracts/abi/RoundEscrow.abi.json that the API actually calls.
export const roundEscrowAbi = parseAbi([
  'function createRound(address founder, uint256 target, uint64 deadline, uint16[] milestoneBps, uint16 returnCapBps) returns (uint256)',
  'function invest(uint256 roundId, uint256 amount)',
  'function finalize(uint256 roundId)',
  'function releaseMilestone(uint256 roundId)',
  'function refund(uint256 roundId)',
  'function distribute(uint256 roundId, uint256 amount)',
  'function claim(uint256 roundId) returns (uint256)',
  'function getRound(uint256 roundId) view returns ((address founder, uint256 target, uint256 raised, uint64 deadline, uint8 status, uint16 releasedCount, uint16 returnCapBps, uint256 distributed))',
  'function getMilestones(uint256 roundId) view returns (uint16[])',
  'function contributionOf(uint256 roundId, address investor) view returns (uint256)',
  'function investorCountOf(uint256 roundId) view returns (uint256)',
  'function returnCapOf(uint256 roundId) view returns (uint256)',
  'function claimableOf(uint256 roundId, address investor) view returns (uint256)',
  'function claimedOf(uint256 roundId, address investor) view returns (uint256)',
  'function roundCount() view returns (uint256)',
  'function usdc() view returns (address)',
  'event RoundCreated(uint256 indexed roundId, address indexed founder, uint256 target, uint64 deadline, uint16 returnCapBps)',
  'event Invested(uint256 indexed roundId, address indexed investor, uint256 amount, uint256 raised)',
  'event RevenueDistributed(uint256 indexed roundId, address indexed from, uint256 amount, uint256 totalDistributed)',
  'event Claimed(uint256 indexed roundId, address indexed investor, uint256 amount)',
  'error NotPlatform()', 'error InvalidRound()', 'error InvalidStatus()', 'error DeadlinePassed()',
  'error InvalidMilestones()', 'error ZeroAmount()', 'error NothingToRefund()', 'error NotFinalizable()',
  'error ZeroAddress()', 'error InvalidReturnCap()', 'error ExceedsReturnCap()', 'error NothingToClaim()',
  'error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed)',
  'error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed)',
]);

export const ONCHAIN_STATUS = ['Open', 'Funded', 'Failed', 'Closed', 'Repaid'] as const;
