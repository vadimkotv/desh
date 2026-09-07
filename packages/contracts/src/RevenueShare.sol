// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IRevenueShare} from "./IRevenueShare.sol";
import {RoundEscrowBase} from "./RoundEscrowBase.sol";
import {RoundTypes} from "./RoundTypes.sol";

/// @title RevenueShare
/// @notice Revenue-based financing layer: revenue pushed into a funded round is claimable by
///         investors pro-rata to their contribution until `raised * returnCapBps / 10_000`.
/// @dev Sits between `RoundEscrowBase` and `RoundEscrow`. Transfers follow
///      checks-effects-interactions and are reentrancy-guarded.
abstract contract RevenueShare is RoundEscrowBase {
    using SafeERC20 for IERC20;

    /// @dev Cumulative revenue already claimed per investor per round.
    mapping(uint256 roundId => mapping(address investor => uint256)) internal _claimed;

    // ───────────────────────────── mutations ─────────────────────────────

    /// @inheritdoc IRevenueShare
    function distribute(uint256 roundId, uint256 amount) external nonReentrant {
        RoundTypes.Round storage round = _round(roundId);
        RoundTypes.RoundStatus status = round.status;
        if (status != RoundTypes.RoundStatus.Funded && status != RoundTypes.RoundStatus.Closed) {
            revert RoundTypes.InvalidStatus();
        }
        if (amount == 0) revert RoundTypes.ZeroAmount();
        uint256 cap = _returnCap(round);
        uint256 total = round.distributed + amount;
        if (total > cap) revert RoundTypes.ExceedsReturnCap();

        round.distributed = total;
        if (total == cap && status == RoundTypes.RoundStatus.Closed) {
            round.status = RoundTypes.RoundStatus.Repaid;
        }

        _USDC.safeTransferFrom(msg.sender, address(this), amount);
        emit RoundTypes.RevenueDistributed(roundId, msg.sender, amount, total);
    }

    /// @inheritdoc IRevenueShare
    function claim(uint256 roundId) external nonReentrant returns (uint256 amount) {
        RoundTypes.Round storage round = _round(roundId);
        RoundTypes.RoundStatus status = round.status;
        if (status == RoundTypes.RoundStatus.Open || status == RoundTypes.RoundStatus.Failed) {
            revert RoundTypes.InvalidStatus();
        }
        amount = _claimable(roundId, round, msg.sender);
        if (amount == 0) revert RoundTypes.NothingToClaim();

        _claimed[roundId][msg.sender] += amount;

        _USDC.safeTransfer(msg.sender, amount);
        emit RoundTypes.Claimed(roundId, msg.sender, amount);
    }

    // ─────────────────────────────── views ───────────────────────────────

    /// @inheritdoc IRevenueShare
    function returnCapOf(uint256 roundId) external view returns (uint256) {
        return _returnCap(_round(roundId));
    }

    /// @inheritdoc IRevenueShare
    function claimableOf(uint256 roundId, address investor) external view returns (uint256) {
        return _claimable(roundId, _round(roundId), investor);
    }

    /// @inheritdoc IRevenueShare
    function claimedOf(uint256 roundId, address investor) external view returns (uint256) {
        return _claimed[roundId][investor];
    }

    // ────────────────────────────── helpers ──────────────────────────────

    /// @dev `raised * returnCapBps / 10_000`.
    function _returnCap(RoundTypes.Round storage round) internal view returns (uint256) {
        return round.raised * round.returnCapBps / RoundTypes.BPS_DENOMINATOR;
    }

    /// @dev Pro-rata share of everything distributed so far, minus what was already claimed.
    ///      Floors per investor, so the sum of claims never exceeds `distributed`.
    function _claimable(uint256 roundId, RoundTypes.Round storage round, address investor)
        internal
        view
        returns (uint256)
    {
        uint256 raised = round.raised;
        if (raised == 0) return 0;
        uint256 share = round.distributed * _contributions[roundId][investor] / raised;
        return share - _claimed[roundId][investor];
    }

    /// @dev Terminal status after the last milestone: Repaid if the cap is already met.
    function _closedStatus(RoundTypes.Round storage round)
        internal
        view
        returns (RoundTypes.RoundStatus)
    {
        return round.distributed >= _returnCap(round)
            ? RoundTypes.RoundStatus.Repaid
            : RoundTypes.RoundStatus.Closed;
    }
}
