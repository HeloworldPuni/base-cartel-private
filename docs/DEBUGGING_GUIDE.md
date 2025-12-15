
# Debugging Guide

## How to Check Vercel Logs

Since the application runs in a serverless environment on Vercel, the logs are the primary way to verify background jobs like the Quest Engine.

1.  **Navigate to Dashboard**: Go to [https://vercel.com/dashboard](https://vercel.com/dashboard) and select your project (`base-cartel`).
2.  **Open Logs**: Click on the **Logs** tab in the top navigation.
3.  **Filter**: In the Search Bar, enter `QuestEngine`.
4.  **Analyze**:
    *   **"Found X pending events"**: The Indexer successfully saved events to the DB.
    *   **"Processing Event..."**: The Engine is running.
    *   **"COMPLETED..."**: The Logic triggered correctly.

## How to Check Database State

If logs are unclear, you can inspect the database directly using the Prisma Studio or CLI scripts.

### Verify Quests
```bash
npx tsx scripts/verify-quests.ts
```

### Verify Events (Diagnostics)
```bash
npx tsx scripts/debug-quests.ts
```
*(Note: Requires `.env.local` with valid `DATABASE_URL`)*
