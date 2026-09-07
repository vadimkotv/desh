// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title RoundTypes
/// @notice Shared data types, events and errors for the RoundEscrow contract.
/// @dev Kept in a library so the interface, implementation and tests share one definition.
library RoundTypes {
    /// @notice Lifecycle of a fundraising round.
    /// @dev Open -> Funded -> Closed (happy path) or Open -> Failed (refunds).
    enum RoundStatus {
        Open,
        Funded,
        Failed,
        Closed
    }

    /// @notice Core state of a round. Milestone splits are stored separately.
    struct Round {
        address founder;
        uint256 target;
        uint256 raised;
        uint64 deadline;
        RoundStatus status;
        uint16 releasedCount;
    }

    /// @notice Basis-point denominator; milestone splits must sum to this.
    uint16 internal constant BPS_DENOMINATOR = 10_000;
    /// @notice Upper bound on milestones per round to keep release loops cheap.
    uint256 internal constant MAX_MILESTONES = 20;

    event RoundCreated(
        uint256 indexed roundId, address indexed founder, uint256 target, uint64 deadline
    );
    event Invested(
        uint256 indexed roundId, address indexed investor, uint256 amount, uint256 raised
    );
    event RoundFinalized(uint256 indexed roundId, RoundStatus status);
    event MilestoneReleased(uint256 indexed roundId, uint16 index, uint256 amount);
    event Refunded(uint256 indexed roundId, address indexed investor, uint256 amount);
    event PlatformChanged(address indexed platform);

    error NotPlatform();
    error InvalidRound();
    error InvalidStatus();
    error DeadlinePassed();
    error InvalidMilestones();
    error ZeroAmount();
    error NothingToRefund();
    error NotFinalizable();
    error ZeroAddress();
}
