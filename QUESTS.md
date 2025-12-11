
# Reputation & Quest System

## Overview
Base Cartel now includes a Reputation (REP) system and a Quest engine.
- **REP** is off-chain XP stored in the database.
- **Quests** are structured challenges that award REP, and in special cases (Referrals), pending Shares.

## Full Quest Catalog

### A. Daily Ops
- **Raid a Rival**: +10 Rep (Gameplay)
- **Claim Profit**: +5 Rep (Gameplay)
- **Invite a Friend**: +8 Rep (Referral)

### B. Weekly Syndicate
- **Execute 5 Raids**: +50 Rep (Gameplay)
- **Go High-Stakes**: +100 Rep (Gameplay)

### C. Social Growth (One-time)
- **Follow @BaseCartel**: +15 Rep
- **Like & Retweet**: +20 Rep
- **Farcaster Cast**: +25 Rep

### D. Referral Rewards (Shares)
Referral quests award **Pending Shares**, which are subject to Seasonal Caps and Anti-Abuse review.
- **Bring 1 Player**: +20 Pending Shares
- **Bring 3 Players**: +75 Pending Shares
- **Bring 10 Players**: +500 Pending Shares

## Levels
Users level up by accumulating REP.
- **Level 0 (Newbie)**: 0 Rep
- **Level 1 (Associate)**: 100 Rep
- **Level 2 (Caporegime)**: 300 Rep
- **Level 3 (Consigliere)**: 700 Rep
- **Level 4 (Boss)**: 1500 Rep
- **Level 5 (Don)**: 3500 Rep

# Admin Guide

## Pending Shares & Fraud Review
Pending shares from quests (Referrals) require verification before minting.

### 1. View & Approve (UI)
- **URL**: `/admin/shares` (Protected)
- **Filters**: `PENDING`, `APPROVED`, `REJECTED`, `MINTED`.
- **Action**: Review user and share amount. Click `Approve` to mark efficient for script processing, or `Reject`.
- **Fraud Score**: UI shows basic info, strict details in artifacts.

### 2. Processing Script (Automated)
Run the automated engine to validation and "mint" (database update only for now).

**Dry Run (Simulation)**
```bash
npx ts-node scripts/processPendingShares.ts --dry-run
```
- Outputs results to `artifacts/pending_shares_run.json`.
- Status: `WOULD_MINT` or `REJECTED` (if pool exhausted or fraud score > 60).

**Live Run**
```bash
npx ts-node scripts/processPendingShares.ts
```
- **Changes Database**: Updates status to `MINTED` (or `REJECTED`).
- Records "TxHash" (Mocked currently).

## Fraud Detection Logic
The system calculates a `FraudScore` (0-100) based on:
1. **Wallet Age**: New wallets (<24h) get +50 points.
2. **Social**: No linked social = +30 points.
3. **Thresholds**:
   - Score < 35: **PASS** (Auto-mintable)
   - Score 35-60: **REVIEW** (Requires admin approval)
   - Score > 60: **REJECT** (Auto-reject in script)

## Artifacts & Evidence
- **Evidence Logs**: `artifacts/evidence/x/...` and `artifacts/evidence/farcaster/...`
- **Run Reports**: `artifacts/pending_shares_run.json`

## API Endpoints

### GET /api/quests?address=0x...
Returns:
- `rep`: Current Rep.
- `level`: Current Level info + next level progress.
- `quests`: List of active quests.
- `pendingShares`: Count and amount of pending shares.

### POST /api/quests/complete
Body: `{ address: "0x...", questSlug: "..." }`
- Returns `shareStatus: 'PENDING'` if shares were awarded.

