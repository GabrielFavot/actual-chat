# Phase 4: Automation - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Bot automatically monitors ActualBudget for uncategorized transactions and proactively notifies the user. Sends one transaction notification per scheduled poll cycle (every 4 hours). User can categorize via existing /transaction command workflow. Notification state is computed dynamically per poll (no persistent notification log required).

</domain>

<decisions>
## Implementation Decisions

### Poll Interval & Timing
- **Poll interval:** Fixed at 4 hours (hardcoded, not configurable)
- **Poll timing:** Every 4 hours from bot startup (any time, not specific clock times)
- **Poll batching:** Only check at scheduled poll times (no mid-cycle immediate checks)
- **Poll overlap prevention:** Prevent overlapping polls — only one poll runs at a time (use mutex/lock)

### Notification Strategy
- **Transactions per notification:** One message per transaction (separate messages if multiple uncategorized exist)
- **Multiple transactions behavior:** If multiple uncategorized transactions exist in the poll, pick one and notify. User categorizes it. Next poll notifies about the next uncategorized one.
- **Notification tone:** Simple & direct (just the facts, no emoji or extra encouragement)
- **Re-notification policy:** Never re-notify about the same transaction, even if user un-categorizes it
- **No-transactions case:** Silent (bot only sends message if there's something to notify about)

### State Tracking
- **Notification tracking:** No persistent storage needed. On each poll, compare current uncategorized set to previous set. Only notify about new transactions not in the previous set.
- **Single transaction per poll with catch-up:** If the first uncategorized transaction gets categorized DURING the poll (user fast), check if there are more and notify about the next one. Otherwise, wait until next poll.

### Startup & Recovery
- **Startup check:** Check immediately on bot startup for any uncategorized transactions and notify if found
- **Crash recovery:** Start fresh (don't try to resume interrupted polls; ignore what was mid-flight)
- **Offline recovery:** After a restart from downtime, wait for the next scheduled poll (no catch-up notification)
- **Missed poll windows:** If bot was offline during a scheduled poll time, wait for the next scheduled time to resume (don't backfill missed polls)

### OpenCode's Discretion
- Exact implementation of poll mutex/locking mechanism
- How to determine "most recent" vs "oldest" uncategorized transaction when multiple exist
- Error handling and logging during poll failures
- In-memory data structure for tracking "last poll's uncategorized set"

</decisions>

<specifics>
## Specific Ideas

- Keep it simple and lightweight — the polling mechanism should be minimal overhead
- User can manually trigger `/transaction` command anytime to check current status (this is separate from scheduled polling)
- When bot notifies, user should recognize it as the same flow they're already using (Phase 3 experience)

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
