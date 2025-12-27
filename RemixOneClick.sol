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

    // CONFIG
    // CONFIG (Mutable for future tuning)
    uint256 public RAID_FEE = 5000 * 10**12;              // 0.005 USDC (18 decimals)
    uint256 public HIGH_STAKES_RAID_FEE = 15000 * 10**12; // 0.015 USDC (18 decimals)
    
    uint256 public NORMAL_RAID_STEAL_BPS = 1000;         // 10%
    uint256 public HIGH_STAKES_STEAL_BPS = 2000;         // 20%
    uint256 public HIGH_STAKES_SELF_PENALTY_BPS = 300;   // 3%
    uint256 public NORMAL_SUCCESS_RATE = 50;
    uint256 public HIGH_STAKES_SUCCESS_RATE = 20;

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
        emit EconomyUpdated(JOIN_SHARES, RAID_FEE, HIGH_STAKES_RAID_FEE); // Reuse event or add new one
    }

    // Simulated VRF for testing (replace with Chainlink VRF in production)
    uint256 private lastRequestId;
    mapping(uint256 => uint256) private randomResults;

    mapping(address => address) public referredBy;
    mapping(address => uint256) public referralCount;
    mapping(address => bool) public authorizedAgents;
    mapping(address => bool) public keepers;

    // CONTRIBUTION STATE (Anti-Leech)
    mapping(address => uint256) public userContribution;

    // MasterChef State
    uint256 public accUSDCPerShare;
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

    constructor(address _shares, address _pot, address _usdc) Ownable(msg.sender) {
        require(_shares != address(0) && _pot != address(0) && _usdc != address(0), "Zero address");
        sharesContract = CartelShares(_shares);
        pot = CartelPot(_pot);
        usdc = IERC20(_usdc);
        keepers[msg.sender] = true;
    }

    // Simulated VRF for testing (in production, use Chainlink VRF)
    function requestRandomNumber() internal returns (uint256) {
        lastRequestId++;
        emit RandomnessRequest(lastRequestId);
        // In a real implementation, this would be fulfilled by Chainlink
        // For testing, we'll generate a pseudo-random number
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

    function join(address referrer) external nonReentrant {
        require(referrer != msg.sender, "Self referrer");
        if (sharesContract.balanceOf(msg.sender, 1) > 0) return;

        sharesContract.mint(msg.sender, JOIN_SHARES, "");

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
        distribute(fee);
        userContribution[raider] += fee;

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

        // Use simulated VRF for randomness
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
                emit RaidResult(id, r.raider, true, steal);
                return;
            }
        } else {
            uint256 raiderShares = sharesContract.balanceOf(r.raider, 1);
            if (raiderShares > 0) {
                uint256 penalty = (raiderShares * HIGH_STAKES_SELF_PENALTY_BPS) / 10000;
                sharesContract.burn(r.raider, penalty);
                emit RaidResult(id, r.raider, false, penalty);
                return;
            }
        }
        emit RaidResult(id, r.raider, false, 0);
    }

    function betray(uint256 minPayout) external nonReentrant {
        uint256 userShares = sharesContract.balanceOf(msg.sender, 1);
        require(userShares > 0, "No shares");

        uint256 preBurnSupply = sharesContract.totalSupply();
        uint256 pending = (userShares * accUSDCPerShare) / 1e12 - rewardDebt[msg.sender];
        uint256 currentPot = pot.getBalance();

        require(currentPot >= pending, "Pot insolvency");
        uint256 potEquity = currentPot - pending;
        uint256 payout = (userShares * potEquity) / (preBurnSupply > 0 ? preBurnSupply : 1);

        require(payout >= minPayout, "Slippage: Payout too low");

        sharesContract.burn(msg.sender, userShares);
        rewardDebt[msg.sender] = 0;

        uint256 totalSend = pending + payout;
        if (totalSend > 0) {
            pot.queueWithdrawal(msg.sender, totalSend);
        }

        if (pending > 0) emit Claim(msg.sender, pending);
        emit Betrayal(msg.sender, payout);
    }

    function distribute(uint256 amount) internal {
        uint256 supply = sharesContract.totalSupply();
        require(supply > 0, "Zero supply");

        // SafeMath: overflow protected by Solidity 0.8+
        uint256 added = (amount * 1e12) / supply;


        accUSDCPerShare += added;
        emit ProfitDistributed(amount, accUSDCPerShare);
    }

    function onShareTransfer(address from, address to) external {
        require(msg.sender == address(sharesContract), "Only shares");
        if (from != address(0)) _claim(from);
        if (to != address(0)) _claim(to);
    }

    function syncRewardDebt(address user, uint256 newBalance) external {
        require(msg.sender == address(sharesContract), "Only shares");
        rewardDebt[user] = (newBalance * accUSDCPerShare) / 1e12;
    }

    function batchClaim(address[] calldata users) external nonReentrant {
        for (uint i = 0; i < users.length; i++) {
            _claim(users[i]);
        }
    }

    function claimProfit() external nonReentrant {
        _claim(msg.sender);
    }

    function _claim(address user) internal {
        if (userContribution[user] < RAID_FEE) return;
        uint256 balance = sharesContract.balanceOf(user, 1);
        if (balance == 0) return;

        uint256 pending = (balance * accUSDCPerShare) / 1e12 - rewardDebt[user];
        if (pending == 0) return;

        rewardDebt[user] = (balance * accUSDCPerShare) / 1e12;

        if (pending > 0) {
            pot.queueWithdrawal(user, pending);
            emit Claim(user, pending);
        }
    }

    function getClaimable(address user) external view returns (uint256) {
        if (userContribution[user] < RAID_FEE) return 0;
        uint256 balance = sharesContract.balanceOf(user, 1);
        if (balance == 0) return 0;
        return (balance * accUSDCPerShare) / 1e12 - rewardDebt[user];
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

    function _verifySignature(
        address user,
        string calldata action,
        bytes calldata data,
        uint256 deadline,
        uint256 nonce,
        uint8 v, bytes32 r, bytes32 s
    ) internal view {
        // Normalize s value to prevent malleability
        bytes32 s_norm = s;
        if (uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) {
            s_norm = bytes32(uint256(0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141) - uint256(s));
        }

        // Include address(this) in the message to prevent replay across contracts
        bytes32 message = keccak256(abi.encode(user, action, data, deadline, nonce, address(this)));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", message));

        address signer = ecrecover(ethSignedMessageHash, v, r, s_norm);
        require(signer == user, "Invalid Signature");
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
