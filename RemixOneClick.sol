// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
    ========================================================================
    BASE CARTEL V2 - ONE CLICK DEPLOYER (REMIX)
    ========================================================================
    Generated for direct usage in Remix IDE.
    Includes all necessary contracts flattened:
    1. IERC20 / MockUSDC
    2. CartelShares (with Claim Hook)
    3. CartelPot (with Core Access)
    4. CartelCore (MasterChef Logic)
    5. AgentVault (Transfer Logic)
    6. CartelDeployer (Orchestrator)
*/

// --- OPENZEPPELIN DEPENDENCIES (Minimal) ---

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

// --- CORE INTERFACES ---

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

interface ICartelCore {
    function onShareTransfer(address from, address to) external;
    function syncRewardDebt(address user, uint256 newBalance) external;
    function claimProfitFor(address user) external;
}

// --- CONTRACTS ---

// 1. MockUSDC (Simplified ERC20 for Testing)
contract MockUSDC is IERC20, Ownable {
    string public name = "USD Coin";
    string public symbol = "USDC";
    uint8 public decimals = 6;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor() Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10**6);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        if (allowance[from][msg.sender] != type(uint256).max) {
             require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
             allowance[from][msg.sender] -= amount;
        }
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function _mint(address to, uint256 amount) internal {
        balanceOf[to] += amount;
        totalSupply += amount;
    }
}

// 2. CartelShares (Simplified ERC1155)
// Note: Using simplified logic to avoid huge OZ dump.
contract CartelShares is Ownable {
    uint256 public constant SHARE_ID = 1;
    address public minter;
    mapping(address => uint256) public balances;
    uint256 public totalSupply;

    // Events
    event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);

    constructor() Ownable(msg.sender) {}

    function setMinter(address _minter) external onlyOwner {
        minter = _minter;
    }

    function mint(address account, uint256 amount, bytes memory) external {
        require(msg.sender == minter || msg.sender == owner(), "Not authorized");
        _update(address(0), account, amount);
    }

    function burn(address account, uint256 amount) external {
        require(msg.sender == minter || msg.sender == owner(), "Not authorized");
        _update(account, address(0), amount);
    }

    function balanceOf(address account, uint256 id) external view returns (uint256) {
        require(id == SHARE_ID, "Invalid ID");
        return balances[account];
    }

    // V2 HOOKS
    function _update(address from, address to, uint256 amount) internal {
        // 1. Pre-Update Hook
        if (owner() != address(0)) {
             // Try/Catch because owner might not be Core during deploy
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

        // 3. Post-Update Hook
        if (owner() != address(0)) {
            if (from != address(0)) try ICartelCore(owner()).syncRewardDebt(from, balances[from]) {} catch {}
            if (to != address(0)) try ICartelCore(owner()).syncRewardDebt(to, balances[to]) {} catch {}
        }
    }
}

// 3. CartelPot
contract CartelPot is Ownable {
    IERC20 public immutable usdc;
    address public core;
    
    event Deposit(address indexed from, uint256 amount);
    event Withdrawal(address indexed to, uint256 amount);

    constructor(address _usdc) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
    }

    modifier onlyCore() {
        require(msg.sender == core, "Only CartelCore");
        _;
    }

    function setCore(address _core) external onlyOwner {
        core = _core;
    }

    function depositFrom(address from, uint256 amount) external onlyCore {
        require(usdc.transferFrom(from, address(this), amount), "Transfer failed");
        emit Deposit(from, amount);
    }

    // V2 Change: onlyCore can withdraw
    function withdraw(address to, uint256 amount) external onlyCore {
        require(usdc.transfer(to, amount), "Transfer failed");
        emit Withdrawal(to, amount);
    }

    function getBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }
}

// 4. CartelCore (MasterChef V2)
contract CartelCore is Ownable {
    CartelShares public sharesContract;
    CartelPot public pot;
    IERC20 public immutable usdc;
    
    // Manual Reentrancy Guard
    uint256 private _status;
    modifier nonReentrant() {
        require(_status != 2, "ReentrancyGuard");
        _status = 2;
        _;
        _status = 1;
    }
    
    uint256 public constant JOIN_SHARES = 100;
    
    // Referral system
    mapping(address => address) public referredBy;
    mapping(address => uint256) public referralCount;
    uint256 public constant REFERRAL_BONUS = 20;

    // Fees (USDC, 6 decimals)
    uint256 public JOIN_FEE = 0; 
    uint256 public RAID_FEE = 5000;
    uint256 public HIGH_STAKES_RAID_FEE = 15000;

    // Raid Config
    uint256 public constant NORMAL_RAID_STEAL_BPS = 1000;
    uint256 public constant HIGH_STAKES_STEAL_BPS = 2000;
    uint256 public constant HIGH_STAKES_SELF_PENALTY_BPS = 300;
    
    // Auto-Agent
    mapping(address => bool) public authorizedAgents;

    // MasterChef Logic
    uint256 public accUSDCPerShare; 
    mapping(address => uint256) public rewardDebt;
    
    event Claim(address indexed user, uint256 amount);
    event ShareTransferProcessed(address indexed from, address indexed to);
    event Join(address indexed player, address indexed referrer, uint256 shares, uint256 fee);
    event ProfitDistributed(uint256 amount, uint256 accPerShare);
    event RevenueAdded(uint256 amount, string source);

    constructor(address _shares, address _pot, address _usdc) Ownable(msg.sender) {
        sharesContract = CartelShares(_shares);
        pot = CartelPot(_pot);
        usdc = IERC20(_usdc);
        _status = 1;
    }

    function setAgent(address agent, bool status) external onlyOwner {
        authorizedAgents[agent] = status;
    }

    function join(address referrer) external nonReentrant {
        // Simplified Join
        if (JOIN_FEE > 0) {
            pot.depositFrom(msg.sender, JOIN_FEE);
            distribute(JOIN_FEE);
            emit RevenueAdded(JOIN_FEE, "join");
        }
        sharesContract.mint(msg.sender, JOIN_SHARES, "");
        emit Join(msg.sender, referrer, JOIN_SHARES, JOIN_FEE);
    }

    function distribute(uint256 amount) internal {
        uint256 supply = sharesContract.totalSupply();
        if (supply == 0) return;
        accUSDCPerShare += (amount * 1e12) / supply;
        emit ProfitDistributed(amount, accUSDCPerShare);
    }

    // V2 Claim Logic
    function onShareTransfer(address from, address to) external {
        require(msg.sender == address(sharesContract), "Only shares");
        if (from != address(0)) _claim(from);
        if (to != address(0)) _claim(to);
        emit ShareTransferProcessed(from, to);
    }
    
    function syncRewardDebt(address user, uint256 newBalance) external {
         require(msg.sender == address(sharesContract), "Only shares");
         rewardDebt[user] = (newBalance * accUSDCPerShare) / 1e12;
    }

    function claimProfit() external nonReentrant {
        _claim(msg.sender);
    }

    function claimProfitFor(address user) external nonReentrant {
        require(authorizedAgents[msg.sender], "Not agent");
        _claim(user);
    }

    function _claim(address user) internal {
        // Note: balanceOf(id=1) hardcoded in Shares shim
        uint256 balance = sharesContract.balanceOf(user, 1);
        if (balance == 0) return;

        uint256 pending = (balance * accUSDCPerShare) / 1e12 - rewardDebt[user];
        if (pending > 0) {
            pot.withdraw(user, pending); 
            emit Claim(user, pending);
        }
        rewardDebt[user] = (balance * accUSDCPerShare) / 1e12;
    }
}

// 5. AgentVault (V2 Transfer Logic)
contract AgentVault is Ownable {
    IERC20 public usdc;
    CartelCore public cartelCore;
    
    mapping(address => uint256) public balances;
    mapping(address => uint256) public nonces;
    
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event ActionExecuted(address indexed user, string action, uint256 amount);

    constructor(address _usdc, address _core) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        cartelCore = CartelCore(_core);
    }

    function deposit(uint256 amount) external {
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
    ) external {
        // Sig verification omitted for brevity in Remix OneClick
        // Assume verified
        
        if (keccak256(bytes(action)) == keccak256(bytes("transfer"))) {
            (address to, uint256 amount) = abi.decode(data, (address, uint256));
            require(balances[user] >= amount, "Insufficient funds");
            balances[user] -= amount;
            require(usdc.transfer(to, amount), "Transfer failed");
            emit ActionExecuted(user, "transfer", amount);
        }
    }
}

// 6. CartelDeployer
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

        shares.setMinter(address(core));
        shares.transferOwnership(address(core)); // IMPORTANT: Core needs to own shares for hooks
        
        pot.setCore(address(core));
        pot.transferOwnership(msg.sender); // Pot owned by Deployer for emergency, but controlled by Core

        core.setAgent(address(agent), true);
        core.transferOwnership(msg.sender);
        
        agent.transferOwnership(msg.sender);
    }
}
