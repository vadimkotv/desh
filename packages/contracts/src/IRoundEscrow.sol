// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IExitReturns} from "./IExitReturns.sol";
import {IOperated} from "./Operated.sol";
import {RoundTypes} from "./RoundTypes.sol";

/// @title IRoundEscrow
/// @notice Milestone-based USDC escrow for startup fundraising rounds.
/// @dev Investors fund an open round; once the target is met the platform releases
///      tranches to the founder. If the deadline passes under target, investors refund.
///      Capital returns only on a liquidity event, settled through `IExitReturns`.
interface IRoundEscrow is IOperated, IExitReturns {
    // ───────────────────────────── mutations ─────────────────────────────

    /// @notice Create a new round. Only the platform operator may call.
    /// @param founder Recipient of released milestone funds.
    /// @param target Amount of USDC (6 decimals) required for the round to succeed.
    /// @param deadline Unix timestamp after which no more investments are accepted.
    /// @param milestoneBps Release schedule in basis points; must sum to 10 000.
    /// @param equityBps Stake sold by the round in basis points; 10 (0.1%) to 5 000 (50%).
    ///        It fixes the entry valuation at `raised * 10_000 / equityBps`.
    /// @return roundId Sequential id starting at 1.
    function createRound(
        address founder,
        uint256 target,
        uint64 deadline,
        uint16[] calldata milestoneBps,
        uint16 equityBps
    ) external returns (uint256 roundId);

    /// @notice Invest USDC into an open round. Caller must have approved this contract.
    /// @dev Oversubscription beyond the target is allowed.
    function invest(uint256 roundId, uint256 amount) external;

    /// @notice Settle an open round as Funded (target met) or Failed (deadline passed).
    function finalize(uint256 roundId) external;

    /// @notice Release the next milestone tranche to the founder. Only the platform.
    /// @dev After the last tranche the round becomes Closed and waits for an exit.
    function releaseMilestone(uint256 roundId) external;

    /// @notice Withdraw the caller's contribution from a Failed round.
    function refund(uint256 roundId) external;

    // ─────────────────────────────── views ───────────────────────────────

    /// @notice Full round state.
    function getRound(uint256 roundId) external view returns (RoundTypes.Round memory);

    /// @notice Milestone schedule in basis points.
    function getMilestones(uint256 roundId) external view returns (uint16[] memory);

    /// @notice Outstanding contribution of an investor in a round.
    function contributionOf(uint256 roundId, address investor) external view returns (uint256);

    /// @notice Number of distinct investors in a round.
    function investorCountOf(uint256 roundId) external view returns (uint256);

    /// @notice Total number of rounds created (also the latest roundId).
    function roundCount() external view returns (uint256);

    /// @notice The escrowed ERC-20 (USDC).
    function usdc() external view returns (address);
}
