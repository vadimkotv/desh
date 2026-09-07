// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title RoundTypes
/// @notice Shared data types, events and errors for the RoundEscrow contract.
/// @dev Kept in a library so the interface, implementation and tests share one definition.
library RoundTypes {
    /// @notice Lifecycle of a fundraising round.
    /// @dev Open -> Funded -> Closed -> Repaid (happy path) or Open -> Failed (refunds).
    ///      `Repaid` is reached once every milestone is released and revenue distributions
    ///      have hit the return cap.
    enum RoundStatus {
        Open,
        Funded,
        Failed,
        Closed,
        Repaid
    }

    /// @notice Core state of a round. Milestone splits are stored separately.
    /// @dev `returnCapBps` is the investor return multiple in basis points of `raised`
    ///      (10 000 = 1.0x); `distributed` is the cumulative revenue pushed in so far.
    struct Round {
        address founder;
        uint256 target;
        uint256 raised;
        uint64 deadline;
        RoundStatus status;
        uint16 releasedCount;
        uint16 returnCapBps;
        uint256 distributed;
    }

    /// @notice Basis-point denominator; milestone splits must sum to this.
    uint16 internal constant BPS_DENOMINATOR = 10_000;
    /// @notice Upper bound on milestones per round to keep release loops cheap.
    uint256 internal constant MAX_MILESTONES = 20;
    /// @notice Lowest allowed return cap: 1.0x of the amount raised.
    uint16 internal constant MIN_RETURN_CAP_BPS = 10_000;
    /// @notice Highest allowed return cap: 5.0x of the amount raised.
    uint16 internal constant MAX_RETURN_CAP_BPS = 50_000;

    event RoundCreated(
        uint256 indexed roundId,
        address indexed founder,
        uint256 target,
        uint64 deadline,
        uint16 returnCapBps
    );
    event Invested(
        uint256 indexed roundId, address indexed investor, uint256 amount, uint256 raised
    );
    event RoundFinalized(uint256 indexed roundId, RoundStatus status);
    event MilestoneReleased(uint256 indexed roundId, uint16 index, uint256 amount);
    event Refunded(uint256 indexed roundId, address indexed investor, uint256 amount);
    event RevenueDistributed(
        uint256 indexed roundId, address indexed from, uint256 amount, uint256 totalDistributed
    );
    event Claimed(uint256 indexed roundId, address indexed investor, uint256 amount);
    event PlatformChanged(address indexed platform);

    error NotPlatform();
    error InvalidRound();
    error InvalidStatus();
    error DeadlinePassed();
    error InvalidMilestones();
    error InvalidReturnCap();
    error ExceedsReturnCap();
    error ZeroAmount();
    error NothingToRefund();
    error NothingToClaim();
    error NotFinalizable();
    error ZeroAddress();
}
