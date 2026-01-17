// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title GameRewards
 * @dev Smart contract for managing game rewards on Cronos testnet
 */
contract GameRewards is Ownable, ReentrancyGuard {
    IERC20 public usdc;
    address public treasury;
    uint256 public rewardAmount; // Base reward amount in USDC (6 decimals)
    
    // Track which addresses have claimed rewards
    mapping(address => bool) public hasClaimed;
    
    // Track total rewards distributed
    uint256 public totalRewardsDistributed;
    
    // Events
    event RewardClaimed(address indexed player, uint256 amount);
    event ConfigUpdated(address indexed updater);
    event TreasuryUpdated(address indexed newTreasury);
    event RewardAmountUpdated(uint256 newAmount);
    event USDCUpdated(address indexed newUSDC);
    
    /**
     * @dev Constructor
     * @param _usdc Address of USDC token on Cronos testnet
     * @param _treasury Address that will receive/hold USDC for rewards
     * @param _rewardAmount Base reward amount in USDC (6 decimals)
     */
    constructor(
        address _usdc,
        address _treasury,
        uint256 _rewardAmount
    ) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_treasury != address(0), "Invalid treasury address");
        require(_rewardAmount > 0, "Reward amount must be greater than 0");
        
        usdc = IERC20(_usdc);
        treasury = _treasury;
        rewardAmount = _rewardAmount;
    }
    
    /**
     * @dev Claim reward for the caller
     * @notice Players can claim their reward once per address
     */
    function claimReward() external nonReentrant {
        require(!hasClaimed[msg.sender], "Reward already claimed");
        require(usdc.balanceOf(treasury) >= rewardAmount, "Insufficient funds in treasury");
        
        // Mark as claimed
        hasClaimed[msg.sender] = true;
        totalRewardsDistributed += rewardAmount;
        
        // Transfer reward from treasury to player
        require(
            usdc.transferFrom(treasury, msg.sender, rewardAmount),
            "Transfer failed"
        );
        
        emit RewardClaimed(msg.sender, rewardAmount);
    }
    
    /**
     * @dev Set new reward amount (only owner)
     * @param newAmount New reward amount in USDC (6 decimals)
     */
    function setRewardAmount(uint256 newAmount) external onlyOwner {
        require(newAmount > 0, "Reward amount must be greater than 0");
        rewardAmount = newAmount;
        emit RewardAmountUpdated(newAmount);
        emit ConfigUpdated(msg.sender);
    }
    
    /**
     * @dev Set new treasury address (only owner)
     * @param newTreasury New treasury address
     */
    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury address");
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
        emit ConfigUpdated(msg.sender);
    }
    
    /**
     * @dev Set new USDC token address (only owner)
     * @param newUSDC New USDC token address
     */
    function setUSDC(address newUSDC) external onlyOwner {
        require(newUSDC != address(0), "Invalid USDC address");
        usdc = IERC20(newUSDC);
        emit USDCUpdated(newUSDC);
        emit ConfigUpdated(msg.sender);
    }
    
    /**
     * @dev Get contract info
     */
    function getContractInfo() external view returns (
        address usdcAddress,
        address treasuryAddress,
        uint256 currentRewardAmount,
        uint256 totalDistributed,
        uint256 treasuryBalance
    ) {
        return (
            address(usdc),
            treasury,
            rewardAmount,
            totalRewardsDistributed,
            usdc.balanceOf(treasury)
        );
    }
}
