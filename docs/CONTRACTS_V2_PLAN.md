# Cartel V2 Contract Upgrade Plan

This document serves as the master plan for changes scheduled for the **Version 2 (V2)** contract deployment.
Since the original planning context was lost, this file tracks all rediscovered and new requirements.

## 1. Autonomous Agent Payments (CONFIRMED)

**Status**: 🚧 Spec Ready
**Context**: The current `AgentVault` cannot pay for off-chain services (like "Raid Suggestions") because it lacks a generic `transfer` function.

**Requirement**:

- Modify `AgentVault.executeAction` to support a `transfer` action.
- Allow the Agent to push funds from the Vault to a specific address (e.g., the Cartel Pot or a Service Address) for specific services.

```solidity
// AgentVault.sol (V2 Spec)
if (keccak256(bytes(params.action)) == keccak256(bytes("transfer"))) {
    (address to, uint256 amount) = abi.decode(params.data, (address, uint256));
    require(balances[msg.sender] >= amount, "Insufficient funds");
    balances[msg.sender] -= amount;
    usdc.transfer(to, amount);
    emit ActionExecuted(params.user, "transfer", amount);
}
```

## 2. Dashboard Claim Logic (Claim V2)

**Status**: 📜 Spec Complete
**Spec File**: [CLAIM_SYSTEM_V2_DESIGN.md](./CLAIM_SYSTEM_V2_DESIGN.md)

**Overview**:

- Implements "MasterChef" style Global Accumulator for scalable rewards.
- Handles Share Transfers correctly by forcing claims/updates (Hook in `CartelShares._update`).
- Requires upgrades to both `CartelCore` and `CartelShares`.

**V1 Fix (Immediate)**:

- Wire up the current dashboard button to `CartelCore.claimProfit()` (V1 logic) to enable basic functionality until V2 is deployed.

## 3. Other Potential Upgrades

- **Batch Actions**: Execute multiple raids in one tx?
- **Dynamic Fees**: Ensure all fees are adjustable by governance without redeploy.
