// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CartelShares.sol";
import "./CartelPot.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CartelCore is Ownable, ReentrancyGuard {
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CartelShares.sol";
import "./CartelPot.sol";
import "./IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CartelCore is Ownable {
    CartelShares public sharesContract;
    CartelPot public pot;
    IERC20 public immutable usdc;
    
    mapping(address => uint256) public lastClaimTime;
    uint256 public constant DAILY_YIELD_PERCENT = 5; // 5%
    uint256 public constant JOIN_SHARES = 100;
    
    uint256 public currentSeason = 1;
    mapping(address => mapping(uint256 => bool)) public seasonParticipation;
    
    // Referral system
    mapping(address => address) public referredBy;
    mapping(address => uint256) public referralCount;
    uint256 public constant REFERRAL_BONUS = 20;

    // Fees (USDC, 6 decimals)
    uint256 public constant JOIN_FEE = 10000; // 0.01 USDC
    uint256 public constant RAID_FEE = 5000;  // 0.005 USDC

    constructor(address _shares, address _pot, address _usdc) Ownable(msg.sender) {
        sharesContract = CartelShares(_shares);
        pot = CartelPot(_pot);
        usdc = IERC20(_usdc);
    }

    event Join(address indexed player, address indexed referrer, uint256 shares, uint256 fee);
    event Raid(address indexed raider, address indexed target, uint256 amountStolen, bool success, uint256 fee);

    function join(address referrer) external nonReentrant {
        require(sharesContract.balanceOf(msg.sender, 1) == 0, "Already joined");
        // Collect join fee
        require(usdc.transferFrom(msg.sender, address(pot), JOIN_FEE), "Fee payment failed");
        pot.depositFrom(msg.sender, JOIN_FEE);
        
        // Mint initial shares to the user
        sharesContract.mint(msg.sender, JOIN_SHARES, "");
        
        // Track referral if valid
        if (referrer != address(0) && referrer != msg.sender) {
            referredBy[msg.sender] = referrer;
            referralCount[referrer]++;
            
            // Give bonus to referrer
            sharesContract.mint(referrer, REFERRAL_BONUS, "");
        }
        
        emit Join(msg.sender, referrer, JOIN_SHARES, JOIN_FEE);
    }

    function getReferralCount(address user) external view returns (uint256) {
        return referralCount[user];
    }

    function claimYield() external nonReentrant {
        // Check eligibility and transfer USDC from pot to user
        // Placeholder logic
    }

    function raid(address target) external nonReentrant {
        // Collect raid fee
        require(usdc.transferFrom(msg.sender, address(pot), RAID_FEE), "Fee payment failed");
        pot.depositFrom(msg.sender, RAID_FEE);
        
        // Steal shares logic (placeholder)
        bool success = true;
        uint256 stolen = 0;
        
        emit Raid(msg.sender, target, stolen, success, RAID_FEE);
    }

    event Betrayal(address indexed traitor, uint256 amountStolen);

    function betray() external nonReentrant {
        // 1. Burn all shares
        // 2. Calculate payout (e.g. 50% of pot / total shares * user shares)
        // 3. Transfer payout
        // 4. Emit event
        emit Betrayal(msg.sender, 0);
    }
}
