# 🏴‍☠️ Cartel V4: The Heat Economy & Future Roadmap

> **Status**: Ready for Final Testnet Deployment
> **Authors**: User & Antigravity
> **Date**: 2024

---

## 1. The V4 "Heat" Economy 🩸

The core meta of Cartel V4 shifts from **Static Capital** to **Dynamic Activity**.

* **Old Way (V3)**: Buy Shares -> Earn Forever. (Encourages laziness).
* **New Way (V4)**: Buy Shares + **Stay Active** -> Earn Multipliers. (Encourages retention).

### 1.1 The Math

* **Effective Shares** (Your Slice) = `Raw Shares` × `Heat Multiplier`.
* **Heat Score** (`contributionScore`): Increases by `Fees Paid`.
* **Decay**: Score decays by **15% per day** (`0.85x`) every time you interact.
* **Multiplier Formula**:

    ```solidity
    Weight = 1.0 + sqrt(Score / 0.01 USDC)
    Max Weight = 20x
    ```

### 1.2 "Anti-Leech" Mechanics

* **Unified Pot**: `distribute()` now splits rewards to `totalEffectiveShares`. If you have 0 Heat (1.0x), you earn significantly less than active players (up to 20.0x).
* **Betrayal Security**: Fixed a "Double-Dip" exploit. Players cannot claim pending rewards and then Rage Quit against the full pot.

---

## 2. Technical Implementation 🛠️

### 2.1 Smart Contract (`RemixOneClick.sol`)

* **Files**: `CartelCore` overwritten with V4 Logic.
* **Key Functions**:
  * `_updateUser(user, fee)`: Central hub for decay & rewards.
  * `getHeatStatus(user)`: New view function for UI.
  * `betray()`: Hardened.

### 2.2 Frontend Stack (`d:/demos/src`)

* **Data Pipe**: Updated `CartelCore.json` ABI to read `contributionScore` and `lastContributionUpdate`.
* **Simulation**: `src/hooks/useHeat.ts` replicates Solidity decay math in the browser for real-time UI updates.
* **UI Components**:
  * **New**: `HeatWidget.tsx` (Visualizes Rank/Decay).
  * **Deleted**: Fake "Win Rate" meter in `CartelDashboard.tsx`.

---

## 3. Future Roadmap: The "Cartel Token" 🪙

**Idea**: Launch a governance/utility token tied to liquidity.
**Distribution**: Retroactive Airdrop.

### 3.1 Reputation (XP) Strategy

* **Current State**: Reputation (Quests) currently does **NOT** give in-game buffs (No fee discounts, no raid buffs).
* **Purpose**: Reputation is an **Airdrop Multiplier**.
* **Formula (Concept)**:

    ```
    Airdrop Allocation = (Shares Held) × (Activity Count) × (Reputation Tier)
    ```

* **Why**: separation of concerns.
  * **Heat** = Maximizes USDC Yield (Now).
  * **Reputation** = Maximizes Token Airdrop (Future).

---

## 4. Deployment Checklist 🚀

When you are ready to launch "Season 2" (Final Testnet):

1. **Deploy Contract**:
    * Open `RemixOneClick.sol` in Remix.
    * **CRITICAL**: Ensure you are using the latest version (with EIP-712 `_verifySignature` fix).
    * Deploy `CartelDeployer`.
    * Call `deployV2()`.
    * **Note**: This fixes the `invalid s` signature error for Auto-Agents/Signatures.
2. **Update Frontend**:
    * Copy the new `CartelCore` address.
    * Update `.env.local`: `NEXT_PUBLIC_CARTEL_CORE_ADDRESS=...`
    * Start App: `npm run dev`.
3. **Verify**:
    * Check Dashboard: Heat Widget should say "Level: Thug (1.0x)".
    * Perform Action: Raid someone.
    * Check update: Widget should jump to "Soldier" or "Capo" instantly.

---

**End of Report.** 🏁
