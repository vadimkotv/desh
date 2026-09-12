// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title RoundTypes
/// @notice Shared data types, events and errors for the RoundEscrow contract.
/// @dev Kept in a library so the interface, implementation and tests share one definition.
library RoundTypes {
    /// @notice Lifecycle of a fundraising round.
    /// @dev Open -> Funded -> Closed -> Exited (happy path) or Open -> Failed (refunds).
    ///      `Exited` is reached when a liquidity event is settled into the round; from then
    ///      on investors claim their pro-rata share of the proceeds.
    enum RoundStatus {
        Open,
        Funded,
        Failed,
        Closed,
        Exited
    }

    /// @notice The liquidity event that returns capital to investors.
    /// @dev There is no revenue share: a round pays out only when the startup exits.
    enum ExitKind {
        Acquisition,
        IPO,
        TGE,
        Contract
    }

    /// @notice Core state of a round. Milestone splits are stored separately.
    /// @dev `equityBps` is the stake sold by the round (10 000 = 100%), which fixes the
    ///      entry valuation at `raised * 10_000 / equityBps`. `released` is what the founder
    ///      has drawn down; `proceeds` is the claimable pool accumulated by exit settlements.
    struct Round {
        address founder;
        uint256 target;
        uint256 raised;
        uint64 deadline;
        RoundStatus status;
        uint16 releasedCount;
        uint16 equityBps;
        uint256 released;
        uint256 proceeds;
    }

    /// @notice Basis-point denominator; milestone splits must sum to this.
    uint16 internal constant BPS_DENOMINATOR = 10_000;
    /// @notice Upper bound on milestones per round to keep release loops cheap.
    uint256 internal constant MAX_MILESTONES = 20;
    /// @notice Smallest stake a round may sell: 0.1%.
    uint16 internal constant MIN_EQUITY_BPS = 10;
    /// @notice Largest stake a round may sell: 50%.
    uint16 internal constant MAX_EQUITY_BPS = 5_000;

    event RoundCreated(
        uint256 indexed roundId,
        address indexed founder,
        uint256 target,
        uint64 deadline,
        uint16 equityBps
    );
    event Invested(
        uint256 indexed roundId, address indexed investor, uint256 amount, uint256 raised
    );
    event RoundFinalized(uint256 indexed roundId, RoundStatus status);
    event MilestoneReleased(uint256 indexed roundId, uint16 index, uint256 amount);
    event Refunded(uint256 indexed roundId, address indexed investor, uint256 amount);
    event ExitSettled(
        uint256 indexed roundId,
        ExitKind indexed kind,
        uint256 valuation,
        uint256 proceeds,
        uint256 totalProceeds,
        string evidenceUri
    );
    event Claimed(uint256 indexed roundId, address indexed investor, uint256 amount);
    event PlatformChanged(address indexed platform);

    error NotPlatform();
    error NotAuthorized();
    error InvalidRound();
    error InvalidStatus();
    error DeadlinePassed();
    error InvalidMilestones();
    error InvalidEquity();
    error ZeroAmount();
    error NothingToRefund();
    error NothingToClaim();
    error NotFinalizable();
    error ZeroAddress();
}
