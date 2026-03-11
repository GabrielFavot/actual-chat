# Research Summary: ActualBudget Telegram Bot

**Project:** Telegram bot for ActualBudget transaction categorization  
**Synthesized:** 2026-03-11  
**Overall Confidence:** MEDIUM-HIGH

---

## Executive Summary

This project addresses a gap in the ActualBudget ecosystem: the need to categorize transactions via Telegram without opening the web app. No direct competitors exist—**actual-ai** (420 stars) handles autonomous AI categorization, but this project provides **manual categorization through inline polls**, a novel approach enabling 2-tap transaction categorization.

The recommended stack uses **grammy** for Telegram Bot API 9.5 support, **@actual-app/api** for ActualBudget integration, and **better-sqlite3** for local persistence. This is a greenfield product in a greenfield space—the main risk is that users may not want proactive budget notifications at all. Research gaps exist around Telegram callback query handling specifics and actual user behavior for notification preferences.

**Key recommendation:** Build incrementally starting with core API integration, then add Telegram handlers, then automation. This separates concerns and allows testing without the bot running.

---

## Key Findings

### From STACK.md

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x LTS | Runtime required by @actual-app/api |
| TypeScript | 5.x | Type safety for bot logic and API responses |
| grammY | 1.x | Telegram bot framework; supports Bot API 9.5 |
| @actual-app/api | ^2.x | Official ActualBudget Node.js client |
| better-sqlite3 | 11.x | Embedded SQLite for user preferences and state |
| Knex.js | 1.x | Query builder with migration support |

**Critical:** grammY chosen over telegraf (v4 only supports API 7.1 vs 9.5). better-sqlite3 preferred over PostgreSQL—single-instance bot has no concurrency needs.

### From FEATURES.md

**Table Stakes (must-have):**
- Transaction polling from ActualBudget
- Transaction display (amount, payee, date, account)
- Category selection via inline keyboard
- Category sync back to ActualBudget
- Multi-account support
- Basic user authorization (Telegram user ID allowlist)

**Differentiators (value-add):**
- Inline poll UX (2-tap categorization)
- Proactive polling with 4-hour intervals
- Transaction batching (single message for multiple transactions)
- Notification timing (respect quiet hours)
- Category caching

**Anti-features (explicitly avoid):**
- AI auto-categorization
- Web interface
- Manual transaction entry
- Multi-currency support
- Multi-platform (Discord/Slack)

### From ARCHITECTURE.md

**Three-layer system:**
1. **Telegram Layer:** grammY bot, callback handlers, inline keyboards
2. **Application Layer:** Transaction poller, category manager, bot orchestrator
3. **Integration Layer:** ActualBudget client, SQLite database

**Recommended patterns:**
- Repository pattern for ActualBudget API abstraction
- State machine for conversation flow
- Message builder pattern for formatted Telegram messages

**Build order:** config/types → database → actual/client → actual/transactions → actual/categories → telegram/bot → telegram/handlers → poller

### From PITFALLS.md

**Critical pitfalls to prevent:**
1. **ActualBudget API authentication** — Wrong server URL, password format, or sync server not enabled
2. **Transaction race conditions** — User edits in ActualBudget while bot updates; need fresh fetch before update
3. **Stale category IDs** — Categories fetched once and cached; must refresh before notifications
4. **Telegram rate limits** — 4-hour minimum poll interval, deduplicate notifications
5. **Docker native module failure** — better-sqlite3 needs build tools in Alpine image
6. **Bot token exposure** — Mask in logs, use environment variables

---

## Implications for Roadmap

### Suggested Phase Structure

| Phase | Focus | Key Deliverables | Addresses Pitfalls |
|-------|-------|------------------|-------------------|
| **Phase 1** | Bot Foundation | Docker setup, grammY echo bot, secure logging, SQLite migrations | Docker native modules, Token exposure, Rate limits design |
| **Phase 2** | Core Integration | ActualBudget client connection, transaction fetching, category fetching/caching | Auth failures, Stale categories |
| **Phase 3** | Category Sync | Inline keyboard with categories, callback handlers, update transaction API | Race conditions |
| **Phase 4** | Automation | Scheduled poller (4-hour interval), notification deduplication, quiet hours | Rate limits |
| **Phase 5** | Polish | Authorization (user allowlist), history command, error recovery, confirmation messages | UX pitfalls |

### Research Flags

| Phase | Needs Research | Standard Patterns |
|-------|---------------|-------------------|
| Phase 1 | Docker Alpine build config | grammY setup is well-documented |
| Phase 2 | None required | @actual-app/api has official docs |
| Phase 3 | Telegram callback_query handling specifics | Inline keyboard patterns well-documented |
| Phase 4 | User notification preferences (on-demand vs proactive) | Scheduling is standard |
| Phase 5 | None required | Based on project constraints |

### Defer to Post-MVP

- Clear/approve workflow
- Transaction batching optimization
- Category list manual refresh command
- Multiple budget support

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Technologies well-established, clear version requirements |
| Features | MEDIUM | Limited direct competitors; inferred from related tools |
| Architecture | HIGH | Standard patterns for Telegram bots, well-documented |
| Pitfalls | MEDIUM | Common integration issues; some (user behavior) unverified |

### Gaps to Address

1. **Telegram Bot API callback handling specifics** — How exactly do inline polls handle updates? Need implementation verification.
2. **User behavior** — Do users actually want proactive notifications, or would they prefer on-demand checking via command?
3. **actual-ai implementation details** — Limited public documentation; may inform better API patterns.

---

## Sources

| Source | Type | File |
|--------|------|------|
| grammY Documentation | Framework | STACK.md |
| @actual-app/api | API | STACK.md, ARCHITECTURE.md |
| ActualBudget API Docs | Documentation | STACK.md, PITFALLS.md |
| actual-ai (sakowicz/actual-ai) | Reference implementation | FEATURES.md, ARCHITECTURE.md |
| better-sqlite3 | Database | STACK.md, PITFALLS.md |
| Telegram Bot API | Platform docs | ARCHITECTURE.md, PITFALLS.md |
| Coolify Docker | Deployment | STACK.md, PITFALLS.md |

---

*Summary synthesized from 4 parallel research outputs: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md*
