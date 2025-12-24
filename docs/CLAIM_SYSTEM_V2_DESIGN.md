# Claim System V2: Final Implementation Spec

## 1. Executive Answers

### A. Transferability

Are CartelShares transferable? **YES**. CartelShares is an ERC1155 token. It inherits ERC1155 (OpenZeppelin) which includes `safeTransferFrom` and `safeBatchTransferFrom`. Users can transfer shares freely.

### B. Handling Transfers (The "Correction" Problem)

Since shares are transferable, we MUST update `rewardDebt` for both the sender and receiver before the transfer changes their balances. If we don't:

- **Sender** would leave with debt calculated on a higher balance (bad, but harmless to system).
- **Receiver** would receive shares without increased debt, allowing them to claim past rewards immediately (**CRITICAL EXPLOIT**).

**The Hook**: We must override `_update` (ERC1155 logic) in `CartelShares.sol`.

```solidity
function _update(address from, address to, uint256[] memory ids, uint256[] memory values) internal override {
    // 1. Call Core to update rewards for FROM and TO
    ICartelCore(core).onShareTransfer(from, to); 
    
    // 2. Perform actual transfer
    super._update(from, to, ids, values);
}
```

### C. System Constants

- **Total Supply**: `CartelShares.totalSupply(SHARE_ID)`.
- **Precision**: `1e12` (Standard practice to avoid division errors).
- **Claim Order**:
    1. Calculated Pending
    2. Update Debt (to balance * acc)
    3. Transfer Funds

## 2. Architecture: Global Accumulator (MasterChef Style)

### Core State (CartelCore)

```solidity
uint256 public accUSDCPerShare; // Precision: 1e12
mapping(address => uint256) public rewardDebt; // Tracks debt per user
```

### Core Logic Flows

#### 1. Distribute Revenue (`distribute`)

Called whenever USDC enters the Pot (e.g., from Raids).

```solidity
function distribute(uint256 amount) internal {
    uint256 supply = shares.totalSupply(1);
    if (supply == 0) return; // Avoid div by 0
    
    accUSDCPerShare += (amount * 1e12) / supply;
}
```

#### 2. Update Reward State (`updateUser`)

Called by `onShareTransfer` or `claim`. Crucial: This function just "caches" the current global index into the user's debt, effectively marking "all rewards until now" as "accounted for".

**Correct Logic**:

1. Calculate pending for `from`. Send it (Claim).
2. Calculate pending for `to`. Send it (Claim).
3. Proceed with transfer.
4. Recalculate debt for both based on NEW balances.

**Revised Transfer Hook Logic (`onShareTransfer`)**:

```solidity
function onShareTransfer(address from, address to) external onlyShares {
    // 1. Force Claim for Sender (if exists)
    if (from != address(0)) _claim(from);
    
    // 2. Force Claim for Receiver (if exists)
    if (to != address(0)) _claim(to);
    
    // 3. Debt will be updated inside _claim based on PRE-TRANSFER balance.
    // 4. AFTER this function returns, Shares contract updates balances.
}
```

**Final Robust Logic**: Standard MasterChef approach for staked tokens.

- `updatePool()` (handled by distribute).
- For user: `pending = (balance * acc) - debt`. Transfer pending.
- `debt = newBalance * acc`.

Since CartelShares is external, Core doesn't know "newBalance" easily unless passed.

**Final Flow**:

1. **Shares._update**:
    - `Core.claim(from)` (Uses old balance, clears pending).
    - `Core.claim(to)` (Uses old balance, clears pending).
    - `super._update` (Balances change).
    - `Core.sync(from, balanceOf(from))`.
    - `Core.sync(to, balanceOf(to))`.

## 3. Implementation Steps

### A. Contracts

**CartelCore**:

- Add `accUSDCPerShare`, `rewardDebt`.
- Add `distribute(amount)`.
- Add `claim(address user)` (internal/public).
- Add `sync(address user, uint256 newBalance)` (onlyShares).
- Add `getClaimable(address user)` (view).

**CartelShares**:

- Override `_update`.
- Import Core interface.

### B. Frontend

- Read `getClaimable`.
- Write `claim`.
