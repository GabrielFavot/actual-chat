# Feature Landscape: Telegram Budget Bots for ActualBudget

**Domain:** Telegram bot for budget transaction categorization  
**Researched:** 2026-03-11  
**Confidence:** MEDIUM (Limited existing direct competitors; inferred from related tools)

---

## Executive Summary

This is a greenfield space. No direct Telegram bots specifically for ActualBudget exist. The closest related tool is **actual-ai** (420 stars), an autonomous AI categorizer that works without user interaction. This project's value proposition—**manual categorization via inline polls**—is novel in the ActualBudget ecosystem.

The feature landscape breaks down as:
- **Table stakes**: Core transaction polling + category sync
- **Differentiators**: Inline poll UX, proactive notifications, smart batching
- **Anti-features**: AI auto-categorization, web UI, manual transaction entry

---

## Table Stakes

Features users expect. Missing = product feels broken or incomplete.

### 1. Transaction Polling from ActualBudget

| Aspect | Details |
|--------|---------|
| **What** | Query ActualBudget API for uncategorized transactions |
| **Why expected** | Without this, bot has nothing to show users |
| **Complexity** | Medium |
| **Notes** | Requires `@actual-app/api` package; uses `getTransactions()` with filters for `category: null` |

### 2. Transaction Display

| Aspect | Details |
|--------|---------|
| **What** | Show transaction details: amount, payee/description, date, account |
| **Why expected** | Users need context to make categorization decisions |
| **Complexity** | Low |
| **Notes** | Format should be scannable in Telegram message |

### 3. Category Selection UI

| Aspect | Details |
|--------|---------|
| **What** | Present available categories from ActualBudget as inline poll buttons |
| **Why expected** | Core interaction—users must be able to pick a category |
| **Complexity** | Medium |
| **Notes** | Requires fetching category list from ActualBudget first |

### 4. Category Sync Back to ActualBudget

| Aspect | Details |
|--------|---------|
| **What** | Update transaction with selected category via API |
| **Why expected** | Without this, categorization has no effect |
| **Complexity** | Medium |
| **Notes** | Use `updateTransaction()` API method |

### 5. Multi-Account Support

| Aspect | Details |
|--------|---------|
| **What** | Handle all accounts from user's ActualBudget instance |
| **Why expected** | Users have multiple accounts (checking, credit, cash) |
| **Complexity** | Low-Medium |
| **Notes** | Project scope says "handles all accounts" - no account filtering needed |

### 6. Basic User Authorization

| Aspect | Details |
|--------|---------|
| **What** | Verify user is allowed to use the bot |
| **Why expected** | Security—don't let random people access your budget |
| **Complexity** | Low |
| **Notes** | Telegram user ID allowlist or bot password |

---

## Differentiators

Features that set this product apart. Not expected by users, but valued when present.

### 1. Inline Poll UX (2-Tap Categorization)

| Aspect | Details |
|--------|---------|
| **What** | Use Telegram inline keyboard with category buttons |
| **Why expected** | **This IS the differentiator** |
| **Value prop** | Minimal friction—2 taps to categorize without opening Actual |
| **Complexity** | Medium |
| **Notes** | Not "text-based commands" or "keyboard reply"—uses Telegram's inline poll feature |

### 2. Proactive Polling with Smart Intervals

| Aspect | Details |
|--------|---------|
| **What** | Poll every 4 hours (configurable) and notify only when there are new transactions |
| **Why expected** | Users shouldn't have to remember to open the bot |
| **Value prop** | "Set and forget" categorization |
| **Complexity** | Low-Medium |
| **Notes** | 4-hour interval per PROJECT.md; must avoid spam |

### 3. Transaction Batching

| Aspect | Details |
|--------|---------|
| **What** | Send single message with multiple transactions (instead of separate messages) |
| **Why expected** | With many uncategorized transactions, individual messages are spammy |
| **Value prop** | Reduces notification fatigue |
| **Complexity** | Medium |
| **Notes** | Use Telegram's `editMessageText` to update with user responses |

### 4. Notification Timing Intelligence

| Aspect | Details |
|--------|---------|
| **What** | Don't notify during sleeping hours; respect user preferences |
| **Why expected** | Nobody wants 2 AM budget notifications |
| **Value prop** | Respectful, context-aware notifications |
| **Complexity** | Low |
| **Notes** | Configurable quiet hours |

### 5. Category List Caching

| Aspect | Details |
|--------|---------|
| **What** | Cache category list rather than fetching on every poll |
| **Why expected** | Categories don't change frequently |
| **Value prop** | Faster response time, less API load |
| **Complexity** | Low |
| **Notes** | Invalidate cache on category changes |

### 6. Clear/Approve Workflow

| Aspect | Details |
|--------|---------|
| **What** | Option to mark transactions as "cleared" after categorization |
| **Why expected** | Users want to know what's been reviewed |
| **Value prop** | Better budget hygiene |
| **Complexity** | Low-Medium |
| **Notes** | Extend beyond just category assignment |

---

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

### 1. AI Auto-Categorization

| Anti-Feature | Why Avoid | What To Do Instead |
|--------------|-----------|-------------------|
| **AI guessing** | Explicitly out of scope per PROJECT.md | User prefers manual categorization |

### 2. Web Interface

| Anti-Feature | Why Avoid | What To Do Instead |
|--------------|-----------|-------------------|
| **Dashboard in browser** | Out of scope; Telegram-only | Use ActualBudget for all web access |

### 3. Manual Transaction Entry

| Anti-Feature | Why Avoid | What To Do Instead |
|--------------|-----------|-------------------|
| **Add transactions via bot** | ActualBudget is source of truth | Import transactions in Actual, then categorize in Telegram |

### 4. Full Budget Management in Telegram

| Anti-Feature | Why Avoid | What To Do Instead |
|--------------|-----------|-------------------|
| **Budget limits, reports, forecasting** | Beyond core value prop | Keep bot focused on categorization |

### 5. Multi-Currency Support

| Anti-Feature | Why Avoid | What To Do Instead |
|--------------|-----------|-------------------|
| **Currency conversion** | Out of scope per PROJECT.md | Single currency for MVP |

### 6. Multi-Platform (Discord/Slack)

| Anti-Feature | Why Avoid | What To Do Instead |
|--------------|-----------|-------------------|
| **Platform parity** | Out of scope per PROJECT.md | Telegram-only for MVP |

---

## Feature Dependencies

```
ActualBudget API
     ↓
Fetch uncategorized transactions
     ↓
Fetch available categories ←─────── Category List Cache
     ↓
Build inline keyboard
     ↓
Send notification to user
     ↓
User taps category → Update transaction in ActualBudget
```

| Dependency | Relationship |
|------------|--------------|
| Transaction polling | Requires API connection first |
| Category display | Requires fetching categories before building UI |
| Category sync | Requires valid transaction ID + category ID |
| Inline polls | Requires Telegram Bot API (python-telegram-bot or aiogram) |

---

## MVP Recommendation

For MVP, prioritize in this order:

1. **Transaction polling** (Table stakes)
   - Fetch uncategorized transactions from ActualBudget

2. **Category fetch & display** (Table stakes)
   - Get categories from API, show in message

3. **Inline keyboard with poll buttons** (Differentiator)
   - Core UX - 2-tap categorization

4. **Category sync** (Table stakes)
   - Write category back to ActualBudget

5. **Basic authorization** (Table stakes)
   - User allowlist or password

**Defer to post-MVP:**
- Notification timing intelligence
- Transaction batching (unless volume is high)
- Clear/approve workflow
- Category caching

---

## Sources

| Source | Type | Confidence |
|--------|------|------------|
| [sakowicz/actual-ai](https://github.com/sakowicz/actual-ai) | Reference implementation | HIGH |
| [fpoweredd/Telegram-Budget-Control-Bot](https://github.com/fpoweredd/Telegram-Budget-Control-Bot) | Feature reference | MEDIUM |
| [ActualBudget API docs](https://actualbudget.org/docs/api/) | API capabilities | HIGH |
| [nitroz3us/telegram-budget-tracker](https://github.com/nitroz3us/telegram-budget-tracker) | Feature reference | MEDIUM |
| PROJECT.md | Project constraints | HIGH |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Table stakes | HIGH | Clear from ActualBudget API + generic bot patterns |
| Differentiators | MEDIUM | Based on project constraints, reasonable inference |
| Anti-features | HIGH | Explicitly stated in PROJECT.md |
| Dependencies | HIGH | ActualBudget API is well-documented |
| MVP scope | MEDIUM | Based on PROJECT.md requirements |

---

## Research Gaps

- **Telegram Bot API specifics**: How do inline polls handle updates? Need specific research on `callback_query` handling
- **actual-ai internals**: Could inform how to structure API calls; limited public docs
- **User behavior**: Do users actually want proactive notifications, or would they prefer on-demand checking?

These gaps should be addressed in phase-specific research during implementation.