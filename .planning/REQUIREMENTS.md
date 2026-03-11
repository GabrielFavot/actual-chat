# Requirements: ActualBudget Telegram Notifier

**Defined:** 2026-03-11
**Core Value:** Get transactions categorized with minimal friction — 2 taps and done, without opening Actual.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Integration

- [ ] **INT-01**: Bot connects to ActualBudget via @actual-app/api
- [ ] **INT-02**: Bot fetches uncategorized transactions from all accounts
- [ ] **INT-03**: Bot fetches available categories from ActualBudget
- [ ] **INT-04**: Bot updates transaction with selected category via API

### User Interface

- [ ] **UI-01**: Bot displays transaction details (amount, payee, date, account)
- [ ] **UI-02**: Bot presents categories as inline keyboard buttons
- [ ] **UI-03**: User can tap category button to categorize (2-tap workflow)
- [ ] **UI-04**: Bot sends one transaction per notification (no batching)

### Automation

- [ ] **AUTO-01**: Bot polls every 4 hours for new uncategorized transactions
- [ ] **AUTO-02**: Bot notifies user only when there are new transactions to categorize
- [ ] **AUTO-03**: Bot tracks which transactions have been notified to avoid duplicates

### Authorization

- [ ] **AUTH-01**: Only authorized Telegram user IDs can interact with the bot
- [ ] **AUTH-02**: Unauthorized users receive rejection message

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### UX Enhancement

- **UI-05**: Transaction batching — group multiple transactions in single message
- **UI-06**: Quiet hours — don't notify during sleeping hours (22:00-08:00)
- **UI-07**: Category caching — cache category list to reduce API calls
- **UI-08**: Clear/approve workflow — mark transactions as cleared after categorization

### Features

- **FEAT-01**: Configurable poll interval via Telegram command
- **FEAT-02**: View categorization history via Telegram command
- **FEAT-03**: Skip transaction via Telegram command

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| AI auto-categorization | User prefers manual categorization |
| Web interface | Telegram-only per user preference |
| Manual transaction entry | ActualBudget is source of truth |
| Full budget management | Beyond core value prop |
| Multi-currency support | Single currency for MVP |
| Discord/Slack integration | Telegram-only for MVP |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INT-01 | Phase 2 | Pending |
| INT-02 | Phase 2 | Pending |
| INT-03 | Phase 2 | Pending |
| INT-04 | Phase 3 | Pending |
| UI-01 | Phase 3 | Pending |
| UI-02 | Phase 3 | Pending |
| UI-03 | Phase 3 | Pending |
| UI-04 | Phase 3 | Pending |
| AUTO-01 | Phase 4 | Pending |
| AUTO-02 | Phase 4 | Pending |
| AUTO-03 | Phase 4 | Pending |
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-11*
*Last updated: 2026-03-11 after initial definition*
