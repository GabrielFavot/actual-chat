# Pitfalls Research

**Domain:** Telegram bot for ActualBudget transaction categorization
**Researched:** 2026-03-11
**Confidence:** MEDIUM

---

## Critical Pitfalls

### Pitfall 1: ActualBudget API Authentication Failures

**What goes wrong:**
The bot cannot connect to ActualBudget, resulting in "Failed to connect to ActualBudget" errors. The @actual-app/api package uses a sync server connection with password authentication, which differs from traditional REST API patterns.

**Why it happens:**
- Using wrong server URL format (http vs https, wrong hostname)
- Incorrect password or budget ID
- ActualBudget server not accessible from Docker network
- Sync server not enabled in ActualBudget configuration

**How to avoid:**
1. Verify ActualBudget sync server is enabled in Actual settings
2. Use the correct internal Docker hostname (e.g., `actual` not `localhost` if running in same Docker network)
3. Test connection manually using the same credentials before implementing bot
4. Implement connection validation at startup with clear error messages

**Warning signs:**
- `Error: Unable to load budget` on startup
- Connection timeout after 10+ seconds
- "Invalid credentials" in logs

**Phase to address:**
Phase 2: Core Integration — Implement and test ActualBudget connection before building bot logic

---

### Pitfall 2: Transaction Race Conditions

**What goes wrong:**
User categorizes a transaction in the Telegram bot while simultaneously editing it in ActualBudget. The bot updates with a stale transaction version, causing the update to fail or create data inconsistency.

**Why it happens:**
- No optimistic locking on transaction updates
- Polling and user interaction happen concurrently
- ActualBudget API allows concurrent modifications without version checking

**How to avoid:**
1. Fetch fresh transaction data immediately before each category update
2. Implement retry logic that re-fetches transaction state on conflict
3. Add user feedback: "This transaction was modified elsewhere. Please try again."
4. Consider using transaction IDs to detect stale data

**Warning signs:**
- `Transaction was modified` errors from API
- Category updates not reflecting in ActualBudget
- Users reporting "I categorized but it didn't stick"

**Phase to address:**
Phase 3: Category Sync — Add conflict resolution before deploying user-facing features

---

### Pitfall 3: Stale Category IDs

**What goes wrong:**
Bot sends inline keyboard with category buttons, but user selects one and the update fails because the category was deleted or renamed in ActualBudget.

**Why it happens:**
- Categories are fetched once and cached indefinitely
- User modifies categories in ActualBudget without restarting bot
- Category IDs are internal and can change across budget exports/imports

**How to avoid:**
1. Refresh category list before every notification (or at minimum, hourly)
2. Validate category ID exists before constructing update request
3. If category no longer exists, prompt user to select again
4. Log category refresh events for debugging

**Warning signs:**
- "Category not found" errors after user clicks
- Missing categories in inline keyboard
- Categories in keyboard don't match ActualBudget

**Phase to address:**
Phase 2: Core Integration — Implement category fetching and caching with TTL

---

### Pitfall 4: Telegram Rate Limit Exhaustion

**What goes wrong:**
Bot sends too many messages or callback responses, hitting Telegram Bot API rate limits. Bot becomes unresponsive or messages get dropped.

**Why it happens:**
- Polling interval too short (e.g., every 5 minutes instead of 4 hours)
- Not deduplicating notifications for same transactions
- Bulk transaction batches sent as individual messages

**How to avoid:**
1. Set minimum 4-hour poll interval (per PROJECT.md)
2. Track already-notified transaction IDs in database
3. Batch multiple transactions into single messages using Telegram's inline keyboard
4. Implement exponential backoff on rate limit errors

**Warning signs:**
- `Too Many Requests: retry after X` errors
- Delayed message delivery
- Bot stops responding during high transaction volume

**Phase to address:**
Phase 1: Bot Foundation — Design notification system with rate limits in mind

---

### Pitfall 5: Docker Native Module Compilation Failure

**What goes wrong:**
Container fails to start because better-sqlite3 native module wasn't compiled for the Docker image architecture, or build dependencies are missing.

**Why it happens:**
- better-sqlite3 requires native C++ compilation
- Alpine Linux lacks build tools by default
- Wrong Node.js version in Docker image

**How to avoid:**
1. Install build dependencies in Dockerfile: `apk add --no-cache python3 make g++`
2. Use multi-stage build: compile native modules in build stage, copy to runtime
3. Alternatively, use `sql.js` (pure JavaScript SQLite) to avoid native modules
4. Test Docker build locally before deploying to Coolify

**Warning signs:**
- `Error: Cannot find module './build/Release/better_sqlite3.node'`
- Container exits immediately with code 1
- "Module version mismatch" errors

**Phase to address:**
Phase 1: Bot Foundation — Get Docker container running with database before adding features

---

### Pitfall 6: Telegram Bot Token Exposure

**What goes wrong:**
Bot token gets logged, printed in error messages, or exposed in Docker container inspection, allowing attackers to take control of the bot.

**Why it happens:**
- Logging full bot token in console output
- Including token in error message strings
- Docker inspect revealing environment variables

**How to avoid:**
1. Use environment variables for all secrets (already planned with dotenv)
2. Mask token in logs: show only first 4 and last 4 characters
3. Use Telegram's `dangerous` event for error logging that might include sensitive data
4. Set Docker restart policy to prevent token exposure in crash logs

**Warning signs:**
- Token appears in console output
- Error messages include full token
- Logs accessible via Docker inspect

**Phase to address:**
Phase 1: Bot Foundation — Implement secure logging from the start

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode poll interval | Faster to implement | Must rebuild to change | Never — use env var |
| Skip database, use in-memory | No setup required | Loses state on restart, duplicates notifications | Only for initial testing |
| No error handling on API calls | Less code | Silent failures, debugging nightmare | Never |
| Single try, no retry | Simpler code | Transient failures cause user frustration | Never for production |
| Fetch categories on every poll | Always fresh | Extra API call latency | Acceptable if latency < 500ms |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| ActualBudget | Using localhost URL from Docker | Use container hostname (e.g., `http://actual:5006`) or host network mode |
| ActualBudget | Wrong password format | Use the sync server password from Actual settings, not the encryption key |
| ActualBudget | Not enabling sync server | Verify sync is enabled in ActualBudget Settings → Advanced |
| Telegram Bot API | Using polling instead of webhooks for production | Use long polling for local dev, consider webhooks for production |
| Telegram Bot API | Not handling callback queries | Must answer callback queries or button presses won't work |
| Docker | Running as root | Create and use non-root user for security |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Polling too frequently | User complaints of spam, rate limit errors | Default 4 hours, make configurable | Any interval under 1 hour |
| No transaction deduplication | Same transaction notified multiple times | Store notified transaction IDs in SQLite | At 2nd poll cycle |
| Large inline keyboard | Message exceeds 1024 characters | Split categories across multiple messages or use category groups | > 100 categories |
| Synchronous API calls | Bot freezes during ActualBudget API call | Use async/await, consider worker thread for heavy operations | With 50+ transactions |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| No user authorization | Anyone who finds bot can access your budget | Telegram user ID allowlist check before any action |
| Storing budget password in plain text | Exposure if database is compromised | Environment variables only, never commit to repo |
| No HTTPS for ActualBudget URL | Credentials transmitted in clear | Require HTTPS in production |
| Bot token in source control | Complete bot compromise | .gitignore, CI/CD secrets management |
| Verbose error messages | Information disclosure | Sanitize error messages, mask sensitive data |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Unclear transaction info | User can't identify transaction | Show: Date, Amount, Payee, Account (format: "📅 2026-03-10 | 💰 -$45.00 | 🏪 Coffee Shop | Checking") |
| No feedback after categorization | User unsure if it worked | Show confirmation: "✅ Categorized as 'Coffee' — $45.00" |
| No way to see history | User forgets what's been done | Add `/history` command showing recently categorized |
| Orphaned callback queries | Buttons stop working after edit | Answer callback queries immediately, or handle gracefully |
| No help command | User lost | Add `/start` and `/help` with clear instructions |

---

## "Looks Done But Isn't" Checklist

- [ ] **ActualBudget Connection:** Bot starts but fails silently on API errors — verify actual API calls work
- [ ] **Transaction Fetching:** Appears to work but returns zero transactions — verify uncategorized filter is correct
- [ ] **Category Updates:** Update returns success but category not changed in Actual — verify transaction ID format
- [ ] **Inline Keyboard:** Keyboard shows but button clicks do nothing — verify callback query handler
- [ ] **Docker Deployment:** Works locally but fails on Coolify — verify network connectivity and environment variables
- [ ] **User Authorization:** All users can access bot — verify Telegram user ID allowlist
- [ ] **Rate Limiting:** Works in testing but spams in production — verify deduplication logic

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Stale category IDs | LOW | User re-selects category; refresh cache automatically |
| Rate limit hit | MEDIUM | Bot recovers after cooldown; implement backoff |
| Database corruption | MEDIUM | Delete SQLite file; bot recreates on restart |
| Transaction race | LOW | Prompt user to retry; no data loss |
| Auth failure | HIGH | Reconfigure credentials in Coolify; redeploy |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Docker native module failure | Phase 1: Bot Foundation | Container runs, SQLite persists data |
| ActualBudget auth failures | Phase 2: Core Integration | Can fetch transactions and categories |
| Telegram rate limits | Phase 1: Bot Foundation | Deduplication logic tested |
| Bot token exposure | Phase 1: Bot Foundation | Logs don't contain secrets |
| Stale category IDs | Phase 2: Core Integration | Categories refresh correctly |
| Transaction race conditions | Phase 3: Category Sync | Concurrent edits handled gracefully |
| UX issues | Phase 4: Polish | User feedback confirms clear communication |

---

## Sources

- ActualBudget API: https://actualbudget.org/docs/api/
- grammY framework: https://grammy.dev/
- Telegram Bot API rate limits: https://core.telegram.org/bots/faq#my-bot-is-hitting-limits
- better-sqlite3 Docker issues: https://github.com/brikis98/docker-build-example
- actual-ai implementation: https://github.com/sakowicz/actual-ai (reference for API patterns)
- Coolify Docker networking: https://coolify.io/docs

---

*Pitfalls research for: Telegram bot + ActualBudget integration*
*Researched: 2026-03-11*
