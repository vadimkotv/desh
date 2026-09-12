// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IRoundEscrow} from "./IRoundEscrow.sol";
import {Operated} from "./Operated.sol";
import {RoundTypes} from "./RoundTypes.sol";

/// @title RoundEscrowBase
/// @notice Storage, read-only views and validation helpers shared by RoundEscrow.
/// @dev State-changing logic lives in `ExitReturns` / `RoundEscrow`; this base has none.
abstract contract RoundEscrowBase is IRoundEscrow, Operated, ReentrancyGuard {
    /// @dev Escrowed token (USDC, 6 decimals on Arc).
    IERC20 internal immutable _USDC;

    /// @dev Number of rounds created so far; ids are 1..roundCount.
    uint256 internal _roundCount;
    mapping(uint256 roundId => RoundTypes.Round) internal _rounds;
    mapping(uint256 roundId => uint16[]) internal _milestones;
    mapping(uint256 roundId => mapping(address investor => uint256)) internal _contributions;
    mapping(uint256 roundId => uint256) internal _investorCount;

    constructor(IERC20 usdc_, address platform_) Operated(platform_) {
        if (address(usdc_) == address(0)) revert RoundTypes.ZeroAddress();
        _USDC = usdc_;
    }

    // ─────────────────────────────── views ───────────────────────────────

    /// @inheritdoc IRoundEscrow
    function getRound(uint256 roundId) external view returns (RoundTypes.Round memory) {
        return _round(roundId);
    }

    /// @inheritdoc IRoundEscrow
    function getMilestones(uint256 roundId) external view returns (uint16[] memory) {
        _round(roundId);
        return _milestones[roundId];
    }

    /// @inheritdoc IRoundEscrow
    function contributionOf(uint256 roundId, address investor) external view returns (uint256) {
        return _contributions[roundId][investor];
    }

    /// @inheritdoc IRoundEscrow
    function investorCountOf(uint256 roundId) external view returns (uint256) {
        return _investorCount[roundId];
    }

    /// @inheritdoc IRoundEscrow
    function roundCount() external view returns (uint256) {
        return _roundCount;
    }

    /// @inheritdoc IRoundEscrow
    function usdc() external view returns (address) {
        return address(_USDC);
    }

    // ────────────────────────────── helpers ──────────────────────────────

    /// @dev Storage pointer to an existing round; reverts on unknown ids.
    function _round(uint256 roundId) internal view returns (RoundTypes.Round storage round) {
        if (roundId == 0 || roundId > _roundCount) revert RoundTypes.InvalidRound();
        round = _rounds[roundId];
    }

    /// @dev Storage pointer to a round that must be in `expected` status.
    function _roundInStatus(uint256 roundId, RoundTypes.RoundStatus expected)
        internal
        view
        returns (RoundTypes.Round storage round)
    {
        round = _round(roundId);
        if (round.status != expected) revert RoundTypes.InvalidStatus();
    }

    /// @dev Milestone schedule must be 1..MAX_MILESTONES entries summing to 10 000 bps.
    function _validateMilestones(uint16[] calldata bps) internal pure {
        uint256 count = bps.length;
        if (count == 0 || count > RoundTypes.MAX_MILESTONES) revert RoundTypes.InvalidMilestones();
        uint256 sum;
        for (uint256 i; i < count; ++i) {
            sum += bps[i];
        }
        if (sum != RoundTypes.BPS_DENOMINATOR) revert RoundTypes.InvalidMilestones();
    }

    /// @dev The stake sold by a round must be between 0.1% and 50%.
    function _validateEquity(uint16 bps) internal pure {
        if (bps < RoundTypes.MIN_EQUITY_BPS || bps > RoundTypes.MAX_EQUITY_BPS) {
            revert RoundTypes.InvalidEquity();
        }
    }
}
