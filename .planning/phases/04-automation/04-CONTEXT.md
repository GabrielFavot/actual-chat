# Phase 4: Automation - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Bot automatically monitors ActualBudget for uncategorized transactions and proactively notifies the user every 4 hours. On each poll, send the newest uncategorized transaction. User can categorize via the existing Phase 3 workflow. No state tracking — just fetch and send the newest each time.

</domain>

<decisions>
## Implementation Decisions

### Poll Interval & Timing
- **Poll interval:** Fixed at 4 hours (hardcoded, not configurable)
- **Poll timing:** Every 4 hours from bot startup (any time, not specific clock times)
- **Startup behavior:** Check immediately on startup for uncategorized transactions and send one if exists

### Transaction Selection Strategy
- **Always send newest:** Each poll cycle, fetch all uncategorized transactions and send the newest one (most recently created)
- **Track notified transactions:** Use NotifierState to track which transactions have been notified, preventing duplicate notifications. State persists across restarts.
- **Re-notification:** If user ignores a transaction (doesn't categorize it), it won't be re-notified. Next poll will send the next newest uncategorized transaction.

### Polling Behavior
- **Poll overlap prevention:** Only one poll runs at a time (use mutex/lock to prevent concurrent executions)
- **Multiple transactions:** If multiple uncategorized exist, send the newest. User categorizes it via Phase 3 flow. Next poll sends the next newest
- **No transactions case:** Silent (bot only sends message if there's something to notify about)
- **Notification tone:** Simple & direct (just the facts, no emoji or extra encouragement)

### OpenCode's Discretion
- Exact implementation of poll mutex/locking mechanism
- Error handling and logging during poll failures
- How to determine "newest" when transactions have same timestamp
- In-memory data structure for tracking last poll time (if needed)

</decisions>

<specifics>
## Specific Ideas

- Keep it simple and lightweight — the polling mechanism should be minimal overhead
- User can manually trigger `/transaction` command anytime to check current status (separate from scheduled polling)
- When bot notifies, user should recognize it as the same flow they're already using (Phase 3 experience)
- "Just take the latest one each time" — no complex state management

</specifics>

<deferred>
## Deferred Ideas

- Configurable poll intervals (AUTO-FEAT-01) — future phase
- Quiet hours / do-not-disturb mode (UI-06 from Phase 3) — future phase
- Smart batching (send multiple transactions in one notification) — future enhancement
- Re-notification after time passes (e.g., nudge after 3 days if still uncategorized) — future phase
- Notification history/analytics — future feature

</deferred>

---

*Phase: 04-automation*
*Context gathered: 2026-03-12*
