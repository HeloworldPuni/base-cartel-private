# 🏴‍☠️ Base Cartel V4: "The Living Economy" 🧬

> **Status**: Ready for Final Testnet Deployment
> **Authors**: User & Antigravity
> **Date**: Dec 2025

## Core Philosophy

**Rewards flow to those who contribute value *now*, not those who contributed *yesterday*. Activity beats dormant capital.**

It converts "paying gas/fees" from a Cost into an **Investment**. Players will effectively pay the protocol to keep their multiplier high. It is the ultimate sticky gamification loop.

---

## 1. The Economic Engine (Contract Layer) 🩸

We replace the static `balanceOf` model with a dynamic **Effective Share** model.

### 1.1 The Formula

Your "Slice of the Pot" is longer just your shares. It is:

`EffectiveShares = RawShares × (1 + WeightMultiplier)`

Where **WeightMultiplier** comes from your Recent "Heat":

```math
Multiplier = sqrt(ContributionScore / K)
```

### 1.2 "Heat" Mechanics

* **Gaining Heat**: Every time you pay a fee (Raid/Betray), your `ContributionScore` increases by the $ amount paid.
* **Losing Heat**: Every day (or action), your `ContributionScore` decays by **15% per day** (`0.85x`).
* **The Grind**: If you stop playing, your multiplier slowly bleeds back to 1.0x. To maintain a high multiplier (e.g. 3x), you must keep burning fees.

### 1.3 Constants (Tuned for Base)

* **Decay**: `0.85` per day (Half-life ~4 days).
* **K Factor**: `0.01 USDC` (Adjusts difficulty of gaining levels).
* **Max Weight**: `20x` (Prevents total monopoly).

### 1.4 "Anti-Leech" Security

* **Unified Pot**: `distribute()` splits rewards to `totalEffectiveShares`. If you have 0 Heat (1.0x), you earn significantly less than active players (up to 20.0x less).
* **Betrayal Security**: Fixed a "Double-Dip" exploit. Players cannot claim pending rewards and then Rage Quit against the full pot.

---

## 2. UX/UI Overhaul: "Visualizing Power" 👁️

A complex math system usually scares users. We must hide the math behind intuitive metaphors.

### 2.1 The "Heat" Metaphor (Dashboard)

Instead of showing "Contribution Score", we show **"Heat Level"** or **"Criminal Rating"**.

**Visual**: A burning bar or circular gauge next to Profile.
**Levels**:

* 🔥 **Level 1 (Thug)**: Multiplier 1.0x - 1.5x
* 🔥🔥 **Level 2 (Soldier)**: Multiplier 1.5x - 3.0x
* 🔥🔥🔥 **Level 3 (Capo)**: Multiplier 3.0x - 5.0x
* ☠️ **Level 4 (Boss)**: Multiplier 5.0x+

**Action**: "Your Heat is cooling down! Raid now to maintain Boss Status."

### 2.2 "Effective Earnings" (Yield Display)

Don't just show "APY". Show "Your Power".

* *Display*: "You own 100 Shares. With your 🔥 **3.5x Multiplier**, you earn like you own **350 Shares**!"

### 2.3 The Decay Timer

Gamify retention.

* *Widget*: "Heat Decay in: 14h 30m".
* *Notification*: "You are about to drop from Capo to Soldier. Raid now to stay on top."

### 2.4 "Estimated Juice" (Action Modals)

When starting a Raid, show the Economic benefit, not just the stolen shares.

* *Before Raid*: "Current Multiplier: 2.1x"
* *Prediction*: "After this Raid: 2.4x (+15% more daily rewards!)"

---

## 3. Technical Implementation & Checklist 🛠️

### Phase 1: Contract (Solidity) [COMPLETE]

- [x] Create `CartelCoreV4.sol` / Update `CartelCore` in `RemixOneClick.sol`.
* [x] Add struct `User { uint128 score; uint64 lastUpdate; ... }`.
* [x] Implement `applyDecay()` with fixed-point math loops.
* [x] Implement `_updateUser()` central hub.
* [x] **Verification Fix**: EIP-712 Signature support in `AgentVault`.

### Phase 2: React Hook (Frontend Math) [TODO]

- [ ] Create `useHeatCalculator.ts` to replicate contract math on client.
* [ ] Show real-time "Decay" prediction (frontend simulation).

### Phase 3: UI Reskin [TODO]

- [ ] **Dashboard**: Add "Heat Bar" widget.
* [ ] **Profile**: Show "Effective Share Count" vs "Real Share Count".
* [ ] **Modals**: Add "Multiplier Boost" preview to Raid/Betray screens.

---

## 4. Future Roadmap: The "Cartel Token" 🪙

**Idea**: Launch a governance/utility token tied to liquidity.
**Distribution**: Retroactive Airdrop.

### 4.1 Reputation (XP) Strategy

* **Heat** = Maximizes USDC Yield (Now).
* **Reputation** = Maximizes Token Airdrop (Future).
* **Formula**: `Airdrop = (Shares) × (Activity) × (Reputation Tier)`

---

## 5. Deployment Checklist 🚀

When you are ready to launch "Season 2" (Final Testnet):

1. **Deploy Contract**:
    * Open `RemixOneClick.sol` in Remix.
    * **CRITICAL**: Ensure you are using the latest version (with EIP-712 `_verifySignature` fix).
    * Deploy `CartelDeployer`.
    * Call `deployV2()`.
    * **Note**: This fixes the `invalid s` signature error for Auto-Agents.

2. **Update Frontend**:
    * Copy the new `CartelCore` address.
    * Update `.env.local`: `NEXT_PUBLIC_CARTEL_CORE_ADDRESS=...`
    * Start App: `npm run dev`.

3. **Verify**:
    * Check Dashboard: Heat Widget should say "Level: Thug (1.0x)".
    * Perform Action: Raid someone.
    * Check update: Widget should jump to "Soldier" or "Capo" instantly.
