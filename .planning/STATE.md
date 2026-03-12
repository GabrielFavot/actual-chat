# State: ActualBudget Telegram Notifier

**Project:** ActualBudget Telegram Notifier  
**Core Value:** Get transactions categorized with minimal friction — 2 taps and done, without opening Actual.  
**Current Phase:** 2 - Integration  
**Status:** In progress

---

## Current Position

| Attribute | Value |
|-----------|-------|
| Current Phase | 4 of 4 (Automation) |
| Plan | 04-01 complete (NotifierState & PollScheduler) |
| Status | In progress - Phase 4 Plan 01 done |
| Progress | █████████████░ 87.5% (7/8 plans complete) |

---

## Performance Metrics

- **Phase 1 Total:** ~3 min 18 sec (Completed 2026-03-11)
- **Phase 2 Total:** ~3 min 53 sec
- **Phase 3 Plan 1 Duration:** ~10 min
- **Phase 3 Plan 2 Duration:** ~20 min
- **Phase 3 Plan 3 Duration:** ~15 min
- **Phase 3 Total:** ~45 min
- **Phase 4 Plan 01 Duration:** ~15 min (Completed 2026-03-12)
- **Cumulative (Phases):** ~64 min
- **Quick Task 001 Duration:** ~10 min
- **Quick Task 002 Duration:** ~15 min
- **Quick Task 003 Duration:** ~10 min
- **Quick Task 004 Duration:** ~5 min
- **Quick Task 005 Duration:** ~10 min
- **Quick Task 006 Duration:** ~8 min
- **Total Quick Tasks:** ~58 min
- **Last activity:** 2026-03-12 - Phase 4 Plan 01: Automated polling and notification state

---

## Accumulated Context

### Decisions

| Decision | Rationale | Status |
|----------|-----------|--------|
| 4 phases for quick depth | Compressed from research's 5 phases | Approved |
| Authorization first | Foundational - all other phases need security | Approved |
| Integration before UI | Need data before displaying it | Approved |
| Automation last | Build manual flow first, then automate | Approved |
| ESM modules for grammY | Required for grammY v1.x compatibility | Approved |
| TELEGRAM_BOT_TOKEN validation | Fails fast if env var missing | Approved |
| AUTHORIZED_USER_IDS validation | Required at startup, fails if missing | Approved |
| Silent ignore for unauthorized | Security best practice - no response | Approved |
| @actual-app/api library | Official ActualBudget client, verified by actual-ai project | Approved |
| Service wrapper pattern | ActualApiService class enables testing and extensibility | Approved |
| File-based state persistence | NotifierState uses JSON file at /tmp/actual-telegram-notif/notifier-state.json | Approved |
| Fixed 4-hour poll interval | Hardcoded 14,400,000 ms to prevent spam while catching new transactions | Approved |
| Newest-first transaction selection | Sort by date (descending), send most recent uncategorized | Approved |
| Skip-if-busy mutex strategy | If poll already running, skip this cycle (don't queue) | Approved |
| Startup check included | Immediate poll when bot starts, no wait for first 4-hour interval | Approved |

### Todos

- [x] Execute Phase 1: Authorization (complete)
- [x] Execute Phase 2 Plan 1: API Service (complete)
- [x] Execute Phase 2 Plan 2: Integration (complete)
- [x] Execute Phase 3: User Interface (complete)
  - [x] Plan 03-01: Enhance API with updateTransaction
  - [x] Plan 03-02: Transaction display command with buttons
  - [x] Plan 03-03: Category button callback handler
- [~] Execute Phase 4: Automation (in progress)
  - [x] Plan 04-01: NotifierState & PollScheduler
  - [ ] Plan 04-02: Testing & verification

### Blockers

- Telegram bot token required (user must create via @BotFather)
- AUTHORIZED_USER_IDS must be set in environment
- ACTUAL_SERVER_URL, ACTUAL_SERVER_PASSWORD, BUDGET_ID required for ActualBudget connection

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 001 | Add /help command for command discovery | 2026-03-12 | 77f9991 | [001-add-help-command](.planning/quick/001-add-help-command/) |
| 002 | Fix payee display and add multi-currency support | 2026-03-12 | 1d1e39d | [002-fix-payee-and-currency](.planning/quick/002-fix-payee-and-currency/) |
| 003 | Fix payee names showing as UUID | 2026-03-12 | a45435b | [003-fix-payee-names-uuid](.planning/quick/003-fix-payee-names-uuid/) |
| 004 | Fix success message with payee name and currency | 2026-03-12 | fed2407 | [004-fix-success-message](.planning/quick/004-fix-success-message/) |
| 005 | Remove currency complexity - simplify to numbers | 2026-03-12 | d4e2140 | [005-remove-currency-complexity](.planning/quick/005-remove-currency-complexity/) |
| 006 | Review /categories command - display all with hierarchy | 2026-03-12 | 4c9045c | [006-on-va-revoir-la-commandes-de-categories-](.planning/quick/006-on-va-revoir-la-commandes-de-categories-/) |
| 007 | Display category groups in transaction form | 2026-03-12 | 0fdd25e | [007-display-category-groups-in-transaction-f](.planning/quick/007-display-category-groups-in-transaction-f/) |
| 008 | Fix account name display in transaction form | 2026-03-12 | 9c6fa5d | [008-fix-account-name-display-in-transaction-](.planning/quick/008-fix-account-name-display-in-transaction-/) |

---

## Session Continuity

**Last session:** 2026-03-12
**Stopped at:** Completed Phase 4 Plan 01 (NotifierState & PollScheduler)
**Resume file:** None

**Next:** Phase 4 Plan 02 (Testing & verification)

---

## Notes

- Project runs on Coolify alongside ActualBudget
- Tech: Node.js with grammY framework in Docker
- Integration: Direct API to ActualBudget (same as actual-ai)
- Platform: Telegram only
- Schedule: Check every 4 hours
