# Actual Budget Telegram Notifier

## What This Is

A Telegram bot that proactively monitors your self-hosted ActualBudget instance, detects uncategorized transactions, and asks you to categorize them via quick inline polls. Runs on your Coolify server alongside Actual.

## Core Value

Get transactions categorized with minimal friction — 2 taps and done, without opening Actual.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Telegram bot polls uncategorized transactions every 4 hours
- [ ] User can categorize via inline Telegram polls
- [ ] Categories sync back to ActualBudget
- [ ] Handles all accounts from ActualBudget

### Out of Scope

- [ ] Auto-categorization via AI — you're doing this manually
- [ ] Multi-currency support — stick to single currency for now
- [ ] Web interface — Telegram is the only UI

## Context

- ActualBudget runs on Coolify at `https://budget.[user-domain]`
- actual-ai already connects to Actual via API, so the connection pattern is proven
- User has moderate transaction volume (not many expenses)
- User prefers manual categorization over AI

## Constraints

- **Tech**: Python bot running in Docker on Coolify
- **Integration**: Direct API access to ActualBudget (same method as actual-ai)
- **Platform**: Telegram only (no Discord/Slack)
- **Schedule**: Check every 4 hours (configurable)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Polls over text | Faster UX, less typing | — Pending |
| Proactive check | No need to remember to categorize | — Pending |
| 4-hour interval | Enough time for new transactions to appear, not too spammy | — Pending |
| All accounts | Simpler config, user can filter in Actual if needed | — Pending |

---
*Last updated: 2026-03-11 after initialization*
