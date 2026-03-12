# ActualBudget Telegram Notifier

## What This Is

A Telegram bot that proactively monitors your self-hosted ActualBudget instance, detects uncategorized transactions, and lets you categorize them with 2 taps via inline keyboard buttons. Runs on your Coolify server alongside Actual. Single-user, self-hosted, zero-friction.

## Core Value

Get transactions categorized with minimal friction — 2 taps and done, without opening Actual.

## Current State

**Shipped:** v1.0 MVP (2026-03-12)
**Stack:** Node.js 20, TypeScript, grammY, @actual-app/api, Docker
**Codebase:** ~1 450 LOC TypeScript across 14 source files
**Deployment:** Docker via Coolify, docker-compose provided

## Requirements

### Validated (v1.0)

- ✓ Bot connects to ActualBudget via @actual-app/api — v1.0
- ✓ Bot fetches uncategorized transactions from all on-budget accounts — v1.0
- ✓ Bot fetches available categories and category groups — v1.0
- ✓ Bot updates transaction with selected category via API — v1.0
- ✓ Bot displays transaction details (amount, payee, date, account) — v1.0
- ✓ Bot presents categories as inline keyboard buttons grouped by group — v1.0
- ✓ User can tap category button to categorize (2-tap workflow) — v1.0
- ✓ Bot sends one transaction per notification — v1.0
- ✓ Bot polls every 4 hours for new uncategorized transactions — v1.0
- ✓ Bot notifies only when new transactions exist (deduplication) — v1.0
- ✓ Bot tracks notified transactions, persists state across restarts — v1.0
- ✓ Only authorized Telegram user can interact (TELEGRAM_USER_ID) — v1.0
- ✓ Unauthorized users silently ignored with security logging — v1.0

### Active (v2 candidates)

- [ ] **UI-06**: Quiet hours — don't notify during sleeping hours (22:00-08:00)
- [ ] **FEAT-03**: Skip transaction command — pass on a transaction without categorizing
- [ ] **FEAT-01**: Configurable poll interval via Telegram command
- [ ] **UI-05**: Transaction batching — show count + navigate through multiple at once
- [ ] **FEAT-02**: View categorization history via Telegram command

### Out of Scope

| Feature | Reason |
|---------|--------|
| AI auto-categorization | User prefers manual categorization |
| Web interface | Telegram-only per user preference |
| Manual transaction entry | ActualBudget is source of truth |
| Full budget management | Beyond core value prop |
| Multi-currency display | Single currency for simplicity |
| Discord/Slack integration | Telegram-only |
| Multi-user support | Solo tool — TELEGRAM_USER_ID is intentionally single |

## Context

- ActualBudget runs on Coolify at `https://budget.[user-domain]`
- Bot runs in same Coolify environment via docker-compose
- User has moderate transaction volume
- User prefers manual categorization over AI
- @actual-app/api connection pattern validated (same as actual-ai project)

## Constraints

- **Tech**: Node.js/TypeScript in Docker on Coolify
- **Integration**: Direct API access to ActualBudget via @actual-app/api
- **Platform**: Telegram only (no Discord/Slack)
- **Users**: Single authorized user (TELEGRAM_USER_ID)
- **Schedule**: Fixed 4-hour check interval

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| grammY framework | TypeScript-native, modern API, excellent type safety | ✓ Good |
| @actual-app/api | Official client, proven by actual-ai | ✓ Good |
| Single authorized user (TELEGRAM_USER_ID) | Solo tool — multi-user adds complexity with no benefit | ✓ Good |
| Inline keyboard over text replies | Faster UX, no typing required | ✓ Good — 2-tap works well |
| SessionManager for callback data | Telegram 64-byte callback_data limit | ✓ Good |
| File-based state persistence | Simple, no DB dependency, Docker-friendly | ✓ Good |
| 4-hour fixed poll interval | Not spammy, catches transactions regularly | ✓ Good |
| Skip-if-busy mutex | Simple, appropriate for 4-hour interval | ✓ Good |
| Newest-first transaction notification | Most relevant transaction surfaced first | ✓ Good |
| buildCategoryKeyboard() utility | Eliminates duplication between command + poller | ✓ Good |
| Proactive check at startup | No wait for first 4-hour interval | ✓ Good |

---
*Last updated: 2026-03-12 after v1.0 milestone*
