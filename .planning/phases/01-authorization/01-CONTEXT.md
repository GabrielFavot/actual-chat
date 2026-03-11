# Phase 1: Authorization - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Security layer that controls which Telegram users can interact with the bot. Only users whose Telegram ID is in the authorized list can use bot commands. This is the foundation phase — all other phases require authorization to be in place.

</domain>

<decisions>
## Implementation Decisions

### User identification
- Telegram user ID only (not username)
- Bot responds with user's ID via /start command
- Silent ignore for unauthorized users (no response)
- Log unauthorized interaction attempts for security monitoring

### Allowlist management
- Environment variable: `AUTHORIZED_USER_IDS`
- Format: comma-separated list (e.g., `123456,789012`)
- Required: bot fails to start if not set
- Single user supported (no comma needed for one ID)

### Rejection behavior
- Silent ignore: unauthorized users receive no response
- Failed attempts logged with timestamp and user info

### OpenCode's Discretion
- Exact log format and storage location
- Error messages when AUTHORIZED_USER_IDS is malformed

</decisions>

<specifics>
## Specific Ideas

- "I want the bot to be secure — only my Telegram ID should work"
- /start should show the user their own ID for easy configuration

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-authorization*
*Context gathered: 2026-03-11*
