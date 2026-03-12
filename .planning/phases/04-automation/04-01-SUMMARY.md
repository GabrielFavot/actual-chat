---
phase: 04-automation
plan: 01
subsystem: automation
tags: [polling, notification-tracking, scheduled-jobs, mutex]

requires:
  - phase: 03-user-interface
    provides: Transaction categorization workflow via buttons

provides:
  - Notification tracking service (NotifierState)
  - 4-hour polling scheduler with startup check
  - Automatic transaction notifications (proactive)
  - Mutex-based poll coordination

affects: [04-02]

tech-stack:
  added: []
  patterns: ["Event-driven polling", "File-based state persistence", "Mutex locking", "Interval scheduling"]

key-files:
  created:
    - src/services/notifier-state.ts
    - src/utils/poll-scheduler.ts
  modified:
    - src/index.ts

key-decisions:
  - "NotifierState persists to /tmp/actual-telegram-notif/notifier-state.json"
  - "Poll interval fixed at 4 hours (14,400,000 ms)"
  - "Startup check runs immediately on bot init"
  - "Newest transaction selected (sorted by date descending)"
  - "Mutex prevents concurrent polls (skip-if-busy strategy)"
  - "Send notification only if transaction not previously notified"
  - "Categories displayed with groups and buttons in notifications"

duration: 15min
completed: 2026-03-12
---

# Phase 4 Plan 01 Summary: Automated Polling & Notification State

**Implement automated polling for uncategorized transactions and track notification history**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-12T13:38:00Z
- **Completed:** 2026-03-12T13:53:00Z
- **Tasks:** 3/3
- **Files created:** 2
- **Files modified:** 1

## Accomplishments

### Task 1: NotifierState Service ✓

- Created `src/services/notifier-state.ts` (107 lines)
- Tracks notified transactions in memory with persistent file backing
- **Methods:**
  - `initialize()` - Load state from `/tmp/actual-telegram-notif/notifier-state.json` on startup
  - `hasBeenNotified(transactionId)` - Check if transaction was already sent
  - `markNotified(transactionId)` - Record transaction as notified and persist to file
- Handles file I/O errors gracefully (continues bot operation)
- Prevents duplicate notifications across bot restarts

### Task 2: PollScheduler Utility ✓

- Created `src/utils/poll-scheduler.ts` (237 lines)
- `startPolling(bot, actualApi, userId, notifierState)` main entry point
- **Polling mechanism:**
  - Startup: Immediate poll check when function called
  - Interval: Every 4 hours (14,400,000 ms)
  - Mutex: Boolean flag prevents concurrent polls (skip if already running)
- **Poll cycle logic:**
  - Fetch uncategorized transactions from API
  - Sort by date (newest first)
  - Check if newest transaction was already notified
  - If new: Mark as notified, send Telegram message with category buttons
  - If duplicate/no transactions: Log silently
- **Error handling:**
  - Catches and logs errors during poll
  - Continues polling even if cycle fails (doesn't crash bot)
- **Notification formatting:**
  - Uses existing `formatTransaction()` for consistency
  - Displays categories grouped with inline keyboard buttons
  - Fetches account name for transaction display

### Task 3: Bot Integration ✓

- Updated `src/index.ts` (added 19 lines)
- **Imports added:**
  - `NotifierState` from `./services/notifier-state.js`
  - `startPolling` from `./utils/poll-scheduler.js`
- **Initialization sequence (after API connected):**
  1. Create NotifierState instance
  2. Call `notifierState.initialize()` to load persisted state
  3. Extract `primaryUserId` from `AUTHORIZED_USER_IDS` environment variable
  4. Start polling scheduler: `startPolling(bot, actualApi, primaryUserId, notifierState)`
- User sees logs confirming each step
- Automation foundation active on bot startup

## Task Commits

| Task | Name | Commit | Type |
|------|------|--------|------|
| 1 | NotifierState service | `eba47ee` | feat |
| 2 | PollScheduler utility | `b21bb3e` | feat |
| 3 | Bot integration | `c661ee5` | feat |

## Files Created/Modified

### Created

- **src/services/notifier-state.ts** (107 lines)
  - NotifierState class with initialize, hasBeenNotified, markNotified methods
  - File-based persistence using JSON
  - Memory-backed Map for O(1) lookups

- **src/utils/poll-scheduler.ts** (237 lines)
  - startPolling() function with immediate + interval polling
  - performPoll() cycle with mutex lock and error handling
  - stopPolling() for graceful shutdown
  - Category button formatting with groups

### Modified

- **src/index.ts** (+19 lines)
  - Added imports for NotifierState and startPolling
  - Initialization after ActualAPI ready
  - Polling startup before bot.start()

## Verification Results

✓ TypeScript compilation: **PASS** (`npm run build`)
✓ File existence checks: **PASS** (both new files present)
✓ Line count checks: **PASS** (107 + 237 lines, > 40+50)
✓ Import integrity: **PASS** (all imports resolve correctly)
✓ Export checks: **PASS** (NotifierState class and startPolling function exported)
✓ Integration checks: **PASS** (imports and calls in src/index.ts)

## Design Decisions

### 1. File-Based State Persistence

**Decision:** NotifierState uses JSON file at `/tmp/actual-telegram-notif/notifier-state.json`

**Rationale:**
- Simple, stateless across restarts (no database needed)
- Works in containerized environment (no persistent volume required)
- Human-readable format for debugging
- Atomic operations sufficient (no concurrent access issues)

**Alternatives considered:**
- In-memory only: Would lose state on restart
- Database: Overcomplicated for simple tracking
- Redis: Requires additional service

### 2. Fixed 4-Hour Poll Interval

**Decision:** POLL_INTERVAL_MS = 4 * 60 * 60 * 1000 (hardcoded)

**Rationale:**
- Prevents notification spam while catching new transactions
- User preference from Phase 4 context
- Not configurable (future enhancement)

### 3. Newest-First Transaction Selection

**Decision:** Sort transactions by date (descending), send the most recent uncategorized one

**Rationale:**
- Matches user's workflow (most urgent first)
- Simple to understand and debug
- Prevents stale transactions being re-notified
- Combined with NotifierState tracking ensures no duplicates

### 4. Mutex Strategy: Skip-If-Busy

**Decision:** If poll already running, skip this cycle (don't queue or wait)

**Rationale:**
- Simple to implement (single boolean flag)
- Prevents queue buildup
- 4-hour interval is large enough that overlap is rare
- Better to skip a cycle than back up

**Alternative not chosen:**
- Queue-based (add complexity)
- Wait-and-retry (could cause delays)

### 5. Startup Check Included

**Decision:** Call performPoll() immediately in startPolling()

**Rationale:**
- User expects notification on bot startup if uncategorized exist
- Doesn't wait for first 4-hour interval
- Catches transactions added since last run

## Deviations from Plan

None - plan executed exactly as specified.

## Authentication & Integration

- Uses existing `ActualApiService.getUncategorizedTransactions()` method
- Uses existing `formatTransaction()` for message formatting
- Uses existing `InlineKeyboard` button structure from Task 2
- Integrates with existing authorization via AUTHORIZED_USER_IDS

## Error Handling

All error scenarios handled gracefully:

| Scenario | Behavior |
|----------|----------|
| File I/O error loading state | Continue with empty state, log warning |
| File I/O error saving state | Log error, continue polling |
| API call fails during poll | Log error, continue polling (don't crash) |
| No categories available | Send message without buttons |
| Account lookup fails | Show "Unknown Account", send notification |
| Concurrent poll attempt | Skip cycle silently |

## Testing Readiness

### Manual Testing Steps

1. **Startup check:** Run bot, verify immediate poll for uncategorized transactions
2. **File persistence:** Restart bot, verify state file `/tmp/actual-telegram-notif/notifier-state.json` contains notified transaction IDs
3. **4-hour interval:** Wait 1 minute, add new uncategorized transaction, wait another minute, confirm notification sent
4. **Re-notification prevention:** Verify same transaction never sends twice even across restarts
5. **Mutex lock:** Run multiple poll cycles, verify only one runs at a time (check logs)

### Automated Testing (Phase 04-02)

Next plan will add:
- Unit tests for NotifierState (file I/O, tracking)
- Unit tests for PollScheduler (timing, state integration)
- Integration tests with mock ActualApiService
- Mock Telegram bot for notification verification

## Next Phase Readiness

**Phase 4 Plan 01 Complete** ✓

Automation foundation ready for:

1. **Phase 04-02:** Testing & verification
   - Unit tests for NotifierState
   - Unit tests for PollScheduler
   - Integration tests with mocks
   - Load testing (many transactions)

2. **Future enhancements (deferred):**
   - Configurable poll intervals (UI-06-FEAT-01)
   - Quiet hours / do-not-disturb (UI-06-FEAT-02)
   - Smart batching (multiple transactions per notification)
   - Re-notification nudges (nag after 3 days uncategorized)
   - Notification history/analytics

## User Workflow

1. **Bot starts:** Immediate poll check runs
2. **Every 4 hours:** Automatic poll for new uncategorized transactions
3. **If new transaction found:** Notification sent to user with date, payee, amount, account, + category buttons
4. **User categorizes:** Taps category button (existing Phase 3 flow)
5. **Transaction marked:** Not re-notified in future polls
6. **Bot restarts:** Previous notifications still tracked (state persisted)

---

*Phase: 04-automation*
*Plan: 01 - Notification State & Poll Scheduler*
*Completed: 2026-03-12*
*Status: Ready for Phase 04-02 (Testing)*
