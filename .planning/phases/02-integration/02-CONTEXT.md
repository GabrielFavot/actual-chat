# Phase 2: Integration - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Bot connects to ActualBudget via @actual-app/api and fetches uncategorized transactions and categories. This is the data layer - getting the information needed for Phase 3 UI. Does not include user interface or automation.

</domain>

<decisions>
## Implementation Decisions

### Authentication handling
- Use environment variables, exactly like actual-ai does
- Required env vars:
  - ACTUAL_SERVER_URL - ActualBudget server URL
  - ACTUAL_SERVER_PASSWORD - Sync server password
  - BUDGET_ID - Budget identifier
- Fail fast at startup - validate credentials immediately, exit with error if missing or invalid
- All three credentials are required at startup

### OpenCode's Discretion
- Exact error messages when validation fails
- Connection retry logic and timeout values
- How to handle transient failures

</decisions>

<specifics>
## Specific Ideas

- "Check how it's done on actual-ai" - match their approach exactly
- Environment variable names and behavior should match actual-ai

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-integration*
*Context gathered: 2026-03-11*