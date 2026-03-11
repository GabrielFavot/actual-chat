# Roadmap: ActualBudget Telegram Notifier

**Project:** ActualBudget Telegram Notifier  
**Core Value:** Get transactions categorized with minimal friction — 2 taps and done, without opening Actual.  
**Created:** 2026-03-11

---

## Overview

A Telegram bot that proactively monitors your self-hosted ActualBudget instance, detects uncategorized transactions, and asks you to categorize them via inline keyboard buttons. Runs on your Coolify server alongside Actual.

This roadmap delivers the bot in 4 phases, moving from foundation to automation.

---

## Phase Structure

| Phase | Goal | Requirements |
|-------|------|--------------|
| 1 - Authorization | Users can securely interact with the bot | AUTH-01, AUTH-02 |
| 2 - Integration | Bot connects to ActualBudget and fetches data | INT-01, INT-02, INT-03 |
| 3 - User Interface | Users can categorize transactions via inline buttons | INT-04, UI-01, UI-02, UI-03, UI-04 |
| 4 - Automation | Bot automatically checks for uncategorized transactions | AUTO-01, AUTO-02, AUTO-03 |

---

## Phase Details

### Phase 1: Authorization

**Goal:** Only authorized Telegram users can interact with the bot.

**Dependencies:** None (foundation phase)

**Requirements:**
- AUTH-01: Only authorized Telegram user IDs can interact with the bot
- AUTH-02: Unauthorized users are silently ignored (no response sent, attempts logged for security)

**Success Criteria:**
1. Bot starts and listens for messages
2. Authorized user ID can trigger bot commands and receive responses
3. Unauthorized user ID is silently ignored (no response sent, attempt logged)
4. Authorized user list is configurable via environment variables

**Plans:**
- [x] 01-01-PLAN.md — Project Setup (Complete)
- [ ] 01-02-PLAN.md — Authorization Implementation

---

### Phase 2: Integration

**Goal:** Bot connects to ActualBudget and fetches uncategorized transactions and categories.

**Dependencies:** Phase 1 (authorization in place)

**Requirements:**
- INT-01: Bot connects to ActualBudget via @actual-app/api
- INT-02: Bot fetches uncategorized transactions from all accounts
- INT-03: Bot fetches available categories from ActualBudget

**Success Criteria:**
1. Bot successfully authenticates with ActualBudget using server URL and password
2. Bot retrieves list of uncategorized transactions from all accounts
3. Bot retrieves list of available categories from ActualBudget
4. Connection errors are logged and reported to user

---

### Phase 3: User Interface

**Goal:** Users can categorize transactions via inline keyboard buttons with 2-tap workflow.

**Dependencies:** Phase 2 (data available to display)

**Requirements:**
- INT-04: Bot updates transaction with selected category via API
- UI-01: Bot displays transaction details (amount, payee, date, account)
- UI-02: Bot presents categories as inline keyboard buttons
- UI-03: User can tap category button to categorize (2-tap workflow)
- UI-04: Bot sends one transaction per notification (no batching)

**Success Criteria:**
1. User receives transaction notification with amount, payee, date, and account
2. Inline keyboard displays available categories as tappable buttons
3. Tapping a category button categorizes the transaction in ActualBudget
4. Confirmation message shown after successful categorization
5. Only one transaction per notification message

---

### Phase 4: Automation

**Goal:** Bot automatically checks for uncategorized transactions every 4 hours and notifies user.

**Dependencies:** Phase 3 (manual categorization works)

**Requirements:**
- AUTO-01: Bot polls every 4 hours for new uncategorized transactions
- AUTO-02: Bot notifies user only when there are new transactions to categorize
- AUTO-03: Bot tracks which transactions have been notified to avoid duplicates

**Success Criteria:**
1. Bot runs scheduled job every 4 hours (configurable interval)
2. Bot only sends notification if new uncategorized transactions exist
3. Previously notified transactions are not re-notified
4. Bot persists notification state across restarts

---

## Progress

| Phase | Status | Requirements |
|-------|--------|--------------|
| 1 - Authorization | In Progress: 1/2 plans | 2 |

**Total:** 4 phases, 12 requirements

---

## Notes

- Research from `.planning/research/SUMMARY.md` informed phase structure
- Depth setting: "quick" - compressed to 4 phases
- Transaction batching (UI-05) deferred to v2
- Quiet hours (UI-06) deferred to v2
- Configurable poll interval (FEAT-01) deferred to v2
