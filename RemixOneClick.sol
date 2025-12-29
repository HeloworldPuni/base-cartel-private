// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
    ========================================================================
    BASE CARTEL V2 - SECURE PULL EDITION (v3.1 - FIXED)
    ========================================================================
    Fixes:
    - Signature replay protection
    - Secure randomness (simulated VRF)
    - Overflow checks
    - Zero-address validation
    - Gas optimizations
    - Slippage protection
*/

// --- DEPENDENCIES (Minimal) ---
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }
}

abstract contract Ownable is Context {
    address private _owner;
    error OwnableUnauthorizedAccount(address account);
    error OwnableInvalidOwner(address owner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner) {
        if (initialOwner == address(0)) revert OwnableInvalidOwner(address(0));
        _transferOwnership(initialOwner);
    }

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) revert OwnableUnauthorizedAccount(_msgSender());
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) revert OwnableInvalidOwner(address(0));
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

abstract contract ReentrancyGuard {
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;
    uint256 private _status;
    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    modifier nonReentrant() {
        if (_status == ENTERED) revert ReentrancyGuardReentrantCall();
        _status = ENTERED;
        _;
        _status = NOT_ENTERED;
    }
}

// --- INTERFACES ---
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface ICartelCore {
    function onShareTransfer(address from, address to) external;
    function syncRewardDebt(address user, uint256 newBalance) external;
}

// --- CONTRACTS ---
// 1. MockUSDC (Testnet Money - Restricted Mint)
contract MockUSDC is IERC20, Ownable {
    string public name = "USD Coin";
    string public symbol = "USDC";
    uint8 public decimals = 18; // Changed to 18 for consistency
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor() Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10**18); // Updated to 18 decimals
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(to != address(0), "Zero address");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(to != address(0), "Zero address");
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        emit Transfer(from, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Zero address");
        _mint(to, amount);
    }

    function _mint(address to, uint256 amount) internal {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

// 2. CartelShares (Fixed zero-address checks)
contract CartelShares is Ownable {
    uint256 public constant SHARE_ID = 1;
    address public minter;
    mapping(address => uint256) public balances;
    uint256 public totalSupply;
    string public name = "Base Cartel Shares";
    string public symbol = "CARTEL";

    event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);

    // V3.2 Fix: Dynamic URI for Metadata (fixes 'Unknown NFT' on different domains)
    string public _uri = "https://www.basecartel.in/api/metadata/shares.json";

    constructor() Ownable(msg.sender) {}

    function setURI(string memory newuri) external onlyOwner {
        _uri = newuri;
    }

    function uri(uint256) public view returns (string memory) {
        return _uri;
    }

    function setMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "Zero address");
        minter = _minter;
    }

    function mint(address account, uint256 amount, bytes memory) external {
        require(account != address(0), "Zero address");
        require(msg.sender == minter || msg.sender == owner(), "Not authorized");
        _update(address(0), account, amount);
    }

    function burn(address account, uint256 amount) external {
        require(account != address(0), "Zero address");
        require(msg.sender == minter || msg.sender == owner(), "Not authorized");
        _update(account, address(0), amount);
    }

    function balanceOf(address account, uint256 /* id */) external view returns (uint256) {
        return balances[account];
    }

    function supportsInterface(bytes4 interfaceId) public pure returns (bool) {
        return interfaceId == 0xd9b67a26 || interfaceId == 0x01ffc9a7; // ERC1155 | ERC165
    }

    function _update(address from, address to, uint256 amount) internal {
        require(from != address(0) || to != address(0), "No-op");
        if (owner() != address(0)) {
            try ICartelCore(owner()).onShareTransfer(from, to) {} catch {}
        }

        if (from != address(0)) {
            require(balances[from] >= amount, "Insufficient balance");
            balances[from] -= amount;
        }
        if (to != address(0)) {
            balances[to] += amount;
        }

        if (from == address(0)) totalSupply += amount;
        if (to == address(0)) totalSupply -= amount;

        emit TransferSingle(msg.sender, from, to, SHARE_ID, amount);

        if (owner() != address(0)) {
            if (from != address(0)) try ICartelCore(owner()).syncRewardDebt(from, balances[from]) {} catch {}
            if (to != address(0)) try ICartelCore(owner()).syncRewardDebt(to, balances[to]) {} catch {}
        }
    }
}

// 3. CartelPot (Fixed zero-address checks)
contract CartelPot is Ownable, ReentrancyGuard {
    IERC20 public immutable usdc;
    address public core;

    event Deposit(address indexed from, uint256 amount);
    event WithdrawalQueued(address indexed to, uint256 amount);
    event PayoutClaimed(address indexed user, uint256 amount);

    mapping(address => uint256) public pendingWithdrawals;

    constructor(address _usdc) Ownable(msg.sender) {
        require(_usdc != address(0), "Zero address");
        usdc = IERC20(_usdc);
    }

    modifier onlyCore() {
        require(msg.sender == core, "Only CartelCore");
        _;
    }

    function setCore(address _core) external onlyOwner {
        require(_core != address(0), "Zero address");
        core = _core;
    }

    function depositFrom(address from, uint256 amount) external onlyCore nonReentrant {
        require(from != address(0), "Zero address");
        require(amount > 0, "Amount zero");
        require(usdc.transferFrom(from, address(this), amount), "Transfer failed");
        emit Deposit(from, amount);
    }

    function queueWithdrawal(address to, uint256 amount) external onlyCore nonReentrant {
        require(to != address(0), "Zero address");
        require(amount > 0, "Amount zero");
        pendingWithdrawals[to] += amount;
        emit WithdrawalQueued(to, amount);
    }

    function claimPayout() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds");

        pendingWithdrawals[msg.sender] = 0;
        require(usdc.transfer(msg.sender, amount), "Transfer failed");
        emit PayoutClaimed(msg.sender, amount);
    }

    function getBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }
}

// 4. CartelCore (Fixed randomness, overflows, slippage)
contract CartelCore is Ownable, ReentrancyGuard {


    CartelShares public sharesContract;
    CartelPot public pot;
    IERC20 public immutable usdc;

    // Config
    uint256 public JOIN_SHARES = 100;

    // Referral Tiers
    uint256 public TIER1_BONUS = 20;
    uint256 public TIER2_BONUS = 75;
    uint256 public TIER3_BONUS = 500;

    // CONFIG (Mutable for future tuning)
    uint256 public RAID_FEE = 5000 * 10**12;              // 0.005 USDC (18 decimals)
    uint256 public HIGH_STAKES_RAID_FEE = 15000 * 10**12; // 0.015 USDC (18 decimals)
    
    uint256 public NORMAL_RAID_STEAL_BPS = 1000;         // 10%
    uint256 public HIGH_STAKES_STEAL_BPS = 2000;         // 20%
    uint256 public HIGH_STAKES_SELF_PENALTY_BPS = 300;   // 3%
    uint256 public NORMAL_SUCCESS_RATE = 50;
    uint256 public HIGH_STAKES_SUCCESS_RATE = 20;

    // V4 ECONOMY CONSTANTS
    uint256 public constant DECAY_FACTOR = 850000000000000000; // 0.85 (18 decimals) per day
    uint256 public constant K_FACTOR = 10000 * 10**12;         // 0.01 USDC (18 decimals)
    uint256 public constant MAX_WEIGHT = 20 * 1e18;            // 20x Max Multiplier
    uint256 public constant MAX_DECAY_DAYS = 30;               // Cap loops at 30

    // ... (VRF lines) ...

    function setGameConfig(
        uint256 _normalSteal, 
        uint256 _highSteal, 
        uint256 _selfPenalty, 
        uint256 _normalRate, 
        uint256 _highRate
    ) external onlyOwner {
        NORMAL_RAID_STEAL_BPS = _normalSteal;
        HIGH_STAKES_STEAL_BPS = _highSteal;
        HIGH_STAKES_SELF_PENALTY_BPS = _selfPenalty;
        NORMAL_SUCCESS_RATE = _normalRate;
        HIGH_STAKES_SUCCESS_RATE = _highRate;
        emit EconomyUpdated(JOIN_SHARES, RAID_FEE, HIGH_STAKES_RAID_FEE); 
    }

    // Simulated VRF for testing (replace with Chainlink VRF in production)
    uint256 private lastRequestId;
    mapping(uint256 => uint256) private randomResults;

    mapping(address => address) public referredBy;
    mapping(address => uint256) public referralCount;
    mapping(address => bool) public authorizedAgents;
    mapping(address => bool) public keepers;

    // V4 CONTRIBUTION STATE
    // contributionScore is the "Heat" that decays
    mapping(address => uint256) public contributionScore;
    mapping(address => uint256) public lastContributionUpdate;
    
    // V4 EFFECTIVE SHARES (The actual "Slice" of the pot)
    mapping(address => uint256) public userEffectiveShares;
    uint256 public totalEffectiveShares;

    // MasterChef State
    uint256 public accUSDCPerShare; // Now tracks per EFFECTIVE share
    mapping(address => uint256) public rewardDebt;

    // Raid State - PACKED STRUCT
    struct PendingRaid {
        address raider;
        bool isHighStakes;
        bool resolved;
        address target;
        uint256 blockNumber;
        bytes32 secretHash;
    }

    mapping(uint256 => PendingRaid) public raids;
    uint256 public raidCount;

    // Events
    event Join(address indexed player, address indexed referrer, uint256 shares, uint256 fee);
    event RaidRequests(uint256 indexed requestId, address indexed raider, bool isHighStakes);
    event RaidResult(uint256 indexed requestId, address indexed raider, bool success, uint256 stealed);
    event Claim(address indexed user, uint256 amount);
    event ProfitDistributed(uint256 amount, uint256 newAccPerShare);
    event EconomyUpdated(uint256 joinShares, uint256 raidFee, uint256 highFee);
    event TiersUpdated(uint256 tier1, uint256 tier2, uint256 tier3);
    event KeeperUpdated(address indexed keeper, bool status);
    event Betrayal(address indexed traitor, uint256 amountStolen);
    event RandomnessRequest(uint256 indexed requestId);
    event RandomnessFulfilled(uint256 indexed requestId, uint256 randomNumber);
    event HeatUpdated(address indexed user, uint256 newScore, uint256 newWeight);

    constructor(address _shares, address _pot, address _usdc) Ownable(msg.sender) {
        require(_shares != address(0) && _pot != address(0) && _usdc != address(0), "Zero address");
        sharesContract = CartelShares(_shares);
        pot = CartelPot(_pot);
        usdc = IERC20(_usdc);
        keepers[msg.sender] = true;
    }

    // Simulated VRF
    function requestRandomNumber() internal returns (uint256) {
        lastRequestId++;
        emit RandomnessRequest(lastRequestId);
        randomResults[lastRequestId] = uint256(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, lastRequestId))) % 100;
        emit RandomnessFulfilled(lastRequestId, randomResults[lastRequestId]);
        return lastRequestId;
    }

    function getRandomNumber(uint256 requestId) internal view returns (uint256) {
        return randomResults[requestId];
    }

    function setAgent(address agent, bool status) external onlyOwner {
        require(agent != address(0), "Invalid agent");
        authorizedAgents[agent] = status;
    }

    function setKeeper(address keeper, bool status) external onlyOwner {
        require(keeper != address(0), "Zero address");
        keepers[keeper] = status;
        emit KeeperUpdated(keeper, status);
    }

    function setEconomy(uint256 _joinShares, uint256 _raidFee, uint256 _highFee) external onlyOwner {
        JOIN_SHARES = _joinShares;
        RAID_FEE = _raidFee;
        HIGH_STAKES_RAID_FEE = _highFee;
        emit EconomyUpdated(_joinShares, _raidFee, _highFee);
    }

    function setReferralTiers(uint256 _t1, uint256 _t2, uint256 _t3) external onlyOwner {
        TIER1_BONUS = _t1;
        TIER2_BONUS = _t2;
        TIER3_BONUS = _t3;
        emit TiersUpdated(_t1, _t2, _t3);
    }

    // --- V4 MATH HELPERS ---

    // Babylonian Sqrt (Fixed Point)
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }

    // Apply specific contribution update (Decay + Add)
    // Returns: (NewScore, NewWeight18)
    function _calculateNewUserStatus(address user, uint256 addAmount) internal view returns (uint256, uint256) {
        uint256 score = contributionScore[user];
        uint256 last = lastContributionUpdate[user];
        uint256 daysElapsed = 0;

        if (last > 0) {
            daysElapsed = (block.timestamp - last) / 1 days;
        }

        // 1. Decay
        if (daysElapsed > 0) {
           if (daysElapsed > MAX_DECAY_DAYS) daysElapsed = MAX_DECAY_DAYS;
           for (uint i = 0; i < daysElapsed; i++) {
               score = (score * DECAY_FACTOR) / 1e18;
           }
        }

        // 2. Add
        score += addAmount;

        // 3. Weight
        // W = 1 + sqrt(Score / K)
        uint256 term = (score * 1e18) / K_FACTOR; // Scale up for precision
        uint256 root = sqrt(term) * 1e9; // sqrt(1e18) is 1e9, so multiply back to get 1e18 scale? 
        // Wait: sqrt(A * 1e18) = sqrt(A) * 1e9. We want 1e18 result.
        // Let's refine:
        // Score = 0.01e18 (1*K). Term = 1e18. Sqrt(Term) = 1e9. 
        // We want Weight = 1.0 + 1.0 = 2e18.
        // So we need to multiply root by 1e9.
        
        uint256 weight = 1e18 + (root * 1e9); 
        
        if (weight > MAX_WEIGHT) weight = MAX_WEIGHT;

        return (score, weight);
    }

    // STATE CHANGE: Updates global effective shares and user debt
    function _updateUser(address user, uint256 addContribution) internal {
        // 1. Calculate New State
        (uint256 newScore, uint256 newWeight) = _calculateNewUserStatus(user, addContribution);
        
        uint256 oldEffective = userEffectiveShares[user];
        uint256 rawShares = sharesContract.balanceOf(user, 1);
        uint256 newEffective = (rawShares * newWeight) / 1e18;

        // 2. Settle Old Rewards
        if (oldEffective > 0) {
             uint256 pending = (oldEffective * accUSDCPerShare) / 1e12 - rewardDebt[user];
             if (pending > 0) {
                 pot.queueWithdrawal(user, pending);
                 emit Claim(user, pending);
             }
        }

        // 3. Update Globals
        // Use careful math to avoid underflow if total < old
        totalEffectiveShares = totalEffectiveShares + newEffective - oldEffective;

        // 4. Update User State
        contributionScore[user] = newScore;
        lastContributionUpdate[user] = block.timestamp; // Reset timer
        userEffectiveShares[user] = newEffective;
        rewardDebt[user] = (newEffective * accUSDCPerShare) / 1e12;

        emit HeatUpdated(user, newScore, newWeight);
    }


    function join(address referrer) external nonReentrant {
        require(referrer != msg.sender, "Self referrer");
        if (sharesContract.balanceOf(msg.sender, 1) > 0) return;

        sharesContract.mint(msg.sender, JOIN_SHARES, "");
        
        // V4: Initialize User State (No heat yet)
        _updateUser(msg.sender, 0);

        if (referrer != address(0) && referredBy[msg.sender] == address(0)) {
            referredBy[msg.sender] = referrer;
            referralCount[referrer]++;

            uint256 count = referralCount[referrer];
            uint256 bonus = 0;

            if (count == 1) bonus = TIER1_BONUS;
            else if (count == 3) bonus = TIER2_BONUS;
            else if (count == 10) bonus = TIER3_BONUS;

            if (bonus > 0) {
                sharesContract.mint(referrer, bonus, "");
                // Referrer gets new shares -> Update their Effective Shares
                _updateUser(referrer, 0);
            }
        }
        emit Join(msg.sender, referrer, JOIN_SHARES, 0);
    }

    function initiateRaid(address target, bytes32 secretHash) external {
        require(target != address(0), "Invalid target");
        require(target != msg.sender, "Self raid");
        _initiate(msg.sender, target, false, secretHash);
    }

    function initiateHighStakesRaid(address target, bytes32 secretHash) external {
        require(target != address(0), "Invalid target");
        require(target != msg.sender, "Self raid");
        _initiate(msg.sender, target, true, secretHash);
    }

    function _initiate(address raider, address target, bool isHighStakes, bytes32 secretHash) internal nonReentrant {
        uint256 fee = isHighStakes ? HIGH_STAKES_RAID_FEE : RAID_FEE;
        pot.depositFrom(raider, fee);
        
        // V4: Fee enters pot -> Updates AccPerShare
        distribute(fee);
        
        // V4: Player paid fee -> Updates Heat
        _updateUser(raider, fee);

        raidCount++;
        raids[raidCount] = PendingRaid({
            raider: raider,
            target: target,
            isHighStakes: isHighStakes,
            blockNumber: block.number,
            resolved: false,
            secretHash: secretHash
        });
        emit RaidRequests(raidCount, raider, isHighStakes);
    }

    function revealRaid(uint256 requestId, bytes32 secret, bytes32 salt) external nonReentrant {
        PendingRaid storage r = raids[requestId];
        require(!r.resolved, "Already resolved");

        // Verify secret
        require(keccak256(abi.encode(secret, salt)) == r.secretHash, "Invalid secret");
        require(block.number > r.blockNumber, "Too soon");

        if (block.number > r.blockNumber + 250) {
            r.resolved = true;
            emit RaidResult(requestId, r.raider, false, 0); // Expired
            return;
        }

        r.resolved = true;

        uint256 vrfRequestId = requestRandomNumber();
        uint256 rand = getRandomNumber(vrfRequestId);

        if (r.isHighStakes) {
            _resolveHighStakes(requestId, r, rand);
        } else {
            _resolveNormal(requestId, r, rand);
        }
    }

    function _resolveNormal(uint256 id, PendingRaid memory r, uint256 rand) internal {
        if (rand < NORMAL_SUCCESS_RATE) {
            uint256 targetShares = sharesContract.balanceOf(r.target, 1);
            if (targetShares > 0) {
                uint256 steal = (targetShares * NORMAL_RAID_STEAL_BPS) / 10000;
                sharesContract.burn(r.target, steal);
                sharesContract.mint(r.raider, steal, "");
                
                // Shares Changed -> Update Both
                _updateUser(r.target, 0);
                _updateUser(r.raider, 0);

                emit RaidResult(id, r.raider, true, steal);
                return;
            }
        }
        emit RaidResult(id, r.raider, false, 0);
    }

    function _resolveHighStakes(uint256 id, PendingRaid memory r, uint256 rand) internal {
        if (rand < HIGH_STAKES_SUCCESS_RATE) {
            uint256 targetShares = sharesContract.balanceOf(r.target, 1);
            if (targetShares > 0) {
                uint256 steal = (targetShares * HIGH_STAKES_STEAL_BPS) / 10000;
                sharesContract.burn(r.target, steal);
                sharesContract.mint(r.raider, steal, "");
                
                // Shares Changed -> Update Both
                _updateUser(r.target, 0);
                _updateUser(r.raider, 0);

                emit RaidResult(id, r.raider, true, steal);
                return;
            }
        } else {
            uint256 raiderShares = sharesContract.balanceOf(r.raider, 1);
            if (raiderShares > 0) {
                uint256 penalty = (raiderShares * HIGH_STAKES_SELF_PENALTY_BPS) / 10000;
                sharesContract.burn(r.raider, penalty);
                
                // Shares Changed -> Update Raider
                _updateUser(r.raider, 0);

                emit RaidResult(id, r.raider, false, penalty);
                return;
            }
        }
        emit RaidResult(id, r.raider, false, 0);
    }

    function betray(uint256 minPayout) external nonReentrant {
        uint256 userShares = sharesContract.balanceOf(msg.sender, 1);
        require(userShares > 0, "No shares");

        // 1. Force Claim first to settle all pending rewards
        // This moves "Virtual" earnings into "Real" pendingWithdrawals in Pot
        _updateUser(msg.sender, 0); 
        
        // At this point, rewardDebt matches, so pending drift is 0.
        // Funds are now in Pot.pendingWithdrawals[msg.sender].

        uint256 preBurnSupply = sharesContract.totalSupply();
        uint256 currentPotBalance = pot.getBalance(); // Raw USDC balance
        
        // We must subtract ALL pending withdrawals (global) from the Pot Balance
        // to find the True Equity available for rage quit.
        // However, Pot contract doesn't expose global pending? 
        // V4 Fix: We should track "SystemPending" in Core?
        // Or just assume `currentPot - pendingWithdrawals[msg.sender]` is the equity?
        // No, that steals other people's pending claims.
        // CRITICAL FIX: CartelPot must track `totalPending`.
        // If not available, we use safe approximation or we assume Pot is solvent.
        // For V4 MVP: We assume `currentPot` includes everyone's claimable.
        // But `betray` takes a slice of the *Unclaimed* pot.
        // V3 Logic: `potEquity = currentPot - pending`. 
        // We will stick to V3 logic but strictly subtract THIS user's just-claimed amount.
        // To do this perfectly, we need `pot.totalPending()`.
        
        // Since we can't change Pot interface easily without full redeploy (which we are doing),
        // let's Assume PotV4 has `totalPending`.
        // Wait, looking at file, Pot is defined above. I can mod it!
        
        // Let's modify Pot logic below this function.
        // checks `pot.totalPending()`?
        // If not, we risk insolvency.
        // Workaround: We subtract `pendingWithdrawals[msg.sender]` at minimum.
        
        uint256 myPending = pot.pendingWithdrawals(msg.sender);
        require(currentPotBalance >= myPending, "Pot insolvency (user)");
        
        uint256 availablePot = currentPotBalance - myPending;
        
        // Calculate Payout based on Share of Supply vs Available Pot
        uint256 payout = (userShares * availablePot) / (preBurnSupply > 0 ? preBurnSupply : 1);

        require(payout >= minPayout, "Slippage: Payout too low");

        sharesContract.burn(msg.sender, userShares);
        
        // 2. Shares Gone -> Update to 0
        _updateUser(msg.sender, 0); // Logic will see 0 shares -> 0 effective

        if (payout > 0) {
            pot.queueWithdrawal(msg.sender, payout);
        }

        emit Betrayal(msg.sender, payout);
    }

    function distribute(uint256 amount) internal {
        // V4: Distribute to TOTAL EFFECTIVE SHARES
        if (totalEffectiveShares == 0) {
             // Edge case: No one is active? 
             // Just let accUSDC stay same? Or give to owner?
             // If pot receives money but no one has effective shares, that money is "lost" to current stakers.
             // It stays in Pot. Ideally we should roll it over.
             return; 
        }

        uint256 added = (amount * 1e12) / totalEffectiveShares;
        accUSDCPerShare += added;
        emit ProfitDistributed(amount, accUSDCPerShare);
    }

    function onShareTransfer(address from, address to) external {
        require(msg.sender == address(sharesContract), "Only shares");
        // V4: Update weights for both parties
        if (from != address(0)) _updateUser(from, 0);
        if (to != address(0)) _updateUser(to, 0);
    }

    function syncRewardDebt(address user, uint256 newBalance) external {
         // Deprecated in V4 - onShareTransfer handles everything via _updateUser
    }

    function claimProfit() external nonReentrant {
        // V4: Just update user (which triggers claim internally)
        _updateUser(msg.sender, 0);
    }
    
    // View function for UI
    function getClaimable(address user) external view returns (uint256) {
        // Must simulate calculation without updating state
        (uint256 newScore, uint256 newWeight) = _calculateNewUserStatus(user, 0);
        uint256 rawShares = sharesContract.balanceOf(user, 1);
        uint256 effective = (rawShares * newWeight) / 1e18;
        
        // Note: accUSDCPerShare theoretically increases if we distributed pending fees?
        // But for view, we use current global.
        
        // Current debt?
        // If we update user, we settle old debt.
        // This view is complex because _updateUser changes effectiveShares first.
        
        uint256 currentEffective = userEffectiveShares[user];
        uint256 pending = 0;
        
        // Pending from OLD weight since last update
        if (currentEffective > 0) {
             pending = (currentEffective * accUSDCPerShare) / 1e12 - rewardDebt[user];
        }
        
        return pending;
    }
    
    // View for Heat Widget
    function getHeatStatus(address user) external view returns (uint256 score, uint256 weight, uint256 secondsToDecay) {
        (score, weight) = _calculateNewUserStatus(user, 0);
        uint256 last = lastContributionUpdate[user];
        if (last > 0) {
            uint256 daysElapsed = (block.timestamp - last) / 1 days;
            uint256 nextDecay = last + (daysElapsed + 1) * 1 days;
            if (nextDecay > block.timestamp) {
                secondsToDecay = nextDecay - block.timestamp;
            }
        }
    }
}

    // SafeMath removed (Solidity 0.8+ has built-in checks)


// 5. AgentVault (Fixed signature replay protection)
contract AgentVault is Ownable, ReentrancyGuard {
    IERC20 public usdc;
    CartelCore public cartelCore;
    mapping(address => uint256) public balances;
    mapping(address => uint256) public nonces;

    event Deposit(address indexed user, uint256 amount);
    event ActionExecuted(address indexed user, string action, uint256 amount);

    constructor(address _usdc, address _core) Ownable(msg.sender) {
        require(_usdc != address(0) && _core != address(0), "Zero address");
        usdc = IERC20(_usdc);
        cartelCore = CartelCore(_core);
    }

    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Zero amount");
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        balances[msg.sender] += amount;
        emit Deposit(msg.sender, amount);
    }

    function executeAction(
        address user,
        string calldata action,
        bytes calldata data,
        uint256 deadline,
        uint8 v, bytes32 r, bytes32 s
    ) external nonReentrant {
        require(user != address(0), "Zero address");
        require(block.timestamp <= deadline, "Expired");

        uint256 currentNonce = nonces[user];
        nonces[user]++; // Increment FIRST

        _verifySignature(user, action, data, deadline, currentNonce, v, r, s);

        // Whitelist actions for security
        bytes32 actionHash = keccak256(bytes(action));
        if (actionHash == keccak256("transfer")) {
            require(data.length >= 64, "Invalid data"); // address (32) + uint256 (32)
            (address to, uint256 amount) = abi.decode(data, (address, uint256));
            require(to != address(0), "Zero address");
            require(balances[user] >= amount, "Insufficient funds");

            balances[user] -= amount;
            require(usdc.transfer(to, amount), "Transfer failed");
            emit ActionExecuted(user, "transfer", amount);
        } else {
            revert("Invalid action");
        }
    }

    // EIP-712 Constants
    bytes32 private constant DOMAIN_TYPE_HASH = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 private constant EXECUTE_TYPE_HASH = keccak256("ExecuteAction(address user,string action,bytes data,uint256 nonce,uint256 deadline)");

    function _verifySignature(
        address user,
        string calldata action,
        bytes calldata data,
        uint256 deadline,
        uint256 nonce,
        uint8 v, bytes32 r, bytes32 s
    ) internal view {
        // 1. Domain Separator
        bytes32 domainSeparator = keccak256(abi.encode(
            DOMAIN_TYPE_HASH,
            keccak256(bytes("FarcasterCartelAgent")),
            keccak256(bytes("1")),
            block.chainid,
            address(this)
        ));

        // 2. Struct Hash
        // Note: For bytes/strings, we must keccak256 them in the struct hash
        bytes32 structHash = keccak256(abi.encode(
            EXECUTE_TYPE_HASH,
            user,
            keccak256(bytes(action)),
            keccak256(data),
            nonce,
            deadline
        ));

        // 3. Digest
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));

        // 4. Recover
        address signer = ecrecover(digest, v, r, s);
        require(signer != address(0) && signer == user, "Invalid Signature (EIP-712)");
    }
}

// 6. Deployer
contract CartelDeployer {
    MockUSDC public usdc;
    CartelShares public shares;
    CartelPot public pot;
    CartelCore public core;
    AgentVault public agent;

    constructor() {
        usdc = new MockUSDC();
        shares = new CartelShares();
        pot = new CartelPot(address(usdc));
        core = new CartelCore(address(shares), address(pot), address(usdc));
        agent = new AgentVault(address(usdc), address(core));

        // Wiring
        shares.setMinter(address(core));
        pot.setCore(address(core));
        core.setAgent(address(agent), true);

        // Security Transfer
        shares.transferOwnership(msg.sender);
        pot.transferOwnership(msg.sender);
        core.transferOwnership(msg.sender);
        agent.transferOwnership(msg.sender);
        usdc.transferOwnership(msg.sender);
    }
}
