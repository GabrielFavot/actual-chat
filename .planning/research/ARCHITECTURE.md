# Architecture Research

**Domain:** Telegram bot for budget transaction categorization
**Researched:** 2026-03-11
**Confidence:** HIGH

---

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Telegram Layer                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Bot API   │  │  Callbacks  │  │  Inline Keyboards   │  │
│  │  (grammY)   │  │  (handlers) │  │   (interactions)   │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼───────────────────┼──────────────┘
          │                │                   │
          ▼                ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  Transaction    │  │  Category       │                  │
│  │  Poller         │  │  Manager        │                  │
│  │  (scheduler)    │  │  (cache)        │                  │
│  └────────┬────────┘  └────────┬────────┘                  │
│           │                    │                            │
│  ┌────────┴────────────────────┴─────────┐                │
│  │           Bot Orchestrator             │                │
│  │    (message building, state machine)   │                │
│  └────────────────────┬───────────────────┘                │
└───────────────────────┼─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Integration Layer                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  ActualBudget  │  │  SQLite         │                  │
│  │  Client        │  │  Database       │                  │
│  │  (@actual-app) │  │  (persistence)  │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Bot API (grammY)** | Handle Telegram Bot API, receive updates, send messages | grammY runner with middleware |
| **Callbacks Handler** | Process inline keyboard button presses, poll answers | grammY callback queries |
| **Transaction Poller** | Scheduled job to fetch uncategorized transactions | node-cron or setInterval |
| **Category Manager** | Fetch, cache, and serve category lists | In-memory cache + refresh |
| **Bot Orchestrator** | Coordinate message building, track conversation state | State machine pattern |
| **ActualBudget Client** | Connect to ActualBudget server, query/update data | @actual-app/api wrapper |
| **SQLite Database** | Persist user preferences, transaction state, pending actions | better-sqlite3 + Knex |

---

## Recommended Project Structure

```
src/
├── config/
│   ├── env.ts              # Environment variable loading
│   └── constants.ts        # Bot commands, timeouts, limits
├── services/
│   ├── actual/
│   │   ├── client.ts       # ActualBudget API wrapper
│   │   ├── transactions.ts # Transaction fetching/updates
│   │   └── categories.ts   # Category fetching/caching
│   ├── telegram/
│   │   ├── bot.ts          # grammY bot setup
│   │   ├── handlers.ts     # Update handlers (commands, callbacks)
│   │   ├── keyboards.ts    # Inline keyboard builders
│   │   └── messages.ts     # Message formatters
│   ├── database/
│   │   ├── db.ts           # Knex/better-sqlite3 setup
│   │   ├── migrations/     # Schema migrations
│   │   └── queries.ts      # Database operations
│   └── poller/
│       └── scheduler.ts    # Transaction polling scheduler
├── state/
│   ├── user.ts             # User state management
│   └── transaction.ts      # Transaction state tracking
├── types/
│   ├── actual.ts           # ActualBudget type definitions
│   └── telegram.ts         # Telegram type definitions
├── utils/
│   ├── logger.ts           # Logging utility
│   └── date.ts             # Date/time helpers
└── index.ts                # Application entry point
```

### Structure Rationale

- **`services/actual/`:** Separates ActualBudget API logic into its own module, making it easier to test and swap implementation if needed
- **`services/telegram/`:** Groups all Telegram-related code—handlers, keyboards, messages—co-located for easier navigation
- **`services/database/`:** Database layer isolated; migrations separate from queries for maintainability
- **`services/poller/`:** Polling logic in its own service; allows for easy adjustment of scheduling without touching core logic
- **`state/`:** Simple state management for user sessions and pending transactions; avoids over-engineering with Redux/Context
- **`types/`:** Centralized type definitions; critical for TypeScript to catch integration errors early

---

## Architectural Patterns

### Pattern 1: Repository Pattern for ActualBudget

**What:** Abstract data access behind a repository interface
**When to use:** When interacting with external APIs that may change
**Trade-offs:** Adds abstraction layer but improves testability and maintainability

**Example:**
```typescript
// services/actual/client.ts
interface TransactionRepository {
  getUncategorized(): Promise<Transaction[]>;
  updateCategory(transactionId: string, categoryId: string): Promise<void>;
}

class ActualBudgetRepository implements TransactionRepository {
  constructor(private client: ActualClient) {}

  async getUncategorized(): Promise<Transaction[]> {
    const transactions = await this.client.getTransactions();
    return transactions.filter(t => !t.category);
  }

  async updateCategory(transactionId: string, categoryId: string): Promise<void> {
    await this.client.updateTransaction(transactionId, { category: categoryId });
  }
}
```

### Pattern 2: State Machine for Conversation Flow

**What:** Model bot conversation as discrete states with transitions
**When to use:** When bot has multiple interaction modes (e.g., waiting for category, confirming, idle)
**Trade-offs:** Adds complexity but prevents invalid state combinations

**Example:**
```typescript
// state/user.ts
type UserState = 
  | { status: 'idle' }
  | { status: 'awaiting_category', transactionId: string, amount: number }
  | { status: 'confirming', transactionId: string, categoryId: string };

const userStates = new Map<number, UserState>();

function transition(userId: number, newState: UserState): void {
  userStates.set(userId, newState);
}

function handleCallback(userId: number, callbackData: string): void {
  const current = userStates.get(userId);
  if (!current) return;

  if (current.status === 'awaiting_category') {
    transition(userId, {
      status: 'confirming',
      transactionId: current.transactionId,
      categoryId: callbackData
    });
  }
}
```

### Pattern 3: Message Builder Pattern

**What:** Compose Telegram messages through builder functions
**When to use:** When message formatting is complex or varies by context
**Trade-offs:** Adds small overhead but improves readability and reusability

**Example:**
```typescript
// services/telegram/messages.ts
interface MessageBuilder {
  addHeader(text: string): MessageBuilder;
  addTransactionRow(amount: number, payee: string, date: string): MessageBuilder;
  addCategoryButtons(categories: Category[]): MessageBuilder;
  build(): SendMessageOptions;
}

function transactionMessage(
  transactions: Transaction[], 
  categories: Category[]
): SendMessageOptions {
  return new MessageBuilder()
    .addHeader(`You have ${transactions.length} uncategorized transactions:`)
    .addTransactionsList(transactions)
    .addCategoryButtons(categories)
    .build();
}
```

---

## Data Flow

### Request Flow: Transaction Categorization

```
┌────────────────┐
│ Scheduled      │
│ Job Trigger    │
└───────┬────────┘
        │ (every 4 hours)
        ▼
┌────────────────┐
│ Transaction    │
│ Poller         │
└───────┬────────┘
        │ fetch uncategorized
        ▼
┌────────────────┐
│ ActualBudget   │
│ API            │
└───────┬────────┘
        │ transactions list
        ▼
┌────────────────┐
│ Filter: no     │
│ category       │
└───────┬────────┘
        │ pending transactions
        ▼
┌────────────────┐
│ Category       │
│ Manager        │
└───────┬────────┘
        │ categories (cached)
        ▼
┌────────────────┐
│ Message        │
│ Builder        │
└───────┬────────┘
        │ formatted message + keyboard
        ▼
┌────────────────┐
│ grammY Bot     │
│ API            │
└───────┬────────┘
        │ sendMessage
        ▼
┌────────────────┐
│ Telegram       │
│ User           │
└────────────────┘
```

### Callback Flow: User Category Selection

```
┌────────────────┐
│ User taps      │
│ category       │
│ button         │
└───────┬────────┘
        │ callback_query
        ▼
┌────────────────┐
│ grammY         │
│ Callback       │
│ Handler        │
└───────┬────────┘
        │ parse callback_data
        ▼
┌────────────────┐
│ State Machine  │
│ - Lookup       │
│   transaction  │
│ - Verify       │
│   state        │
└───────┬────────┘
        │ validated
        ▼
┌────────────────┐
│ ActualBudget   │
│ API            │
└───────┬────────┘
        │ updateTransaction(category)
        ▼
┌────────────────┐
│ SQLite DB      │
│ - Mark done   │
│ - Log action  │
└───────┬────────┘
        │ success/failure
        ▼
┌────────────────┐
│ Edit Message   │
│ - Update       │
│   inline       │
│   keyboard     │
└───────┬────────┘
        │ acknowledge
        ▼
┌────────────────┐
│ Telegram       │
│ User           │
└────────────────┘
```

### Key Data Flows

1. **Polling Flow:** Scheduler triggers → Fetch transactions → Filter → Build message → Send to Telegram
2. **Categorization Flow:** User callback → Validate → Update ActualBudget → Update local state → Acknowledge
3. **Category Sync:** On startup → Fetch all categories → Cache locally → Invalidate on budget changes

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1 users | Monolith is fine—no concurrency concerns |
| 1-10 users | Single instance handles all users; just ensure database migrations are safe |
| 10-100 users | Add connection pooling for ActualBudget API; consider message queue for polling |
| 100+ users | Scale horizontally with multiple bot instances; add Redis for shared state |

### Scaling Priorities

1. **First bottleneck: ActualBudget API rate limits**  
   - How to fix: Cache aggressively, batch requests, add request throttling
2. **Second bottleneck: Database writes**  
   - How to fix: Use WAL mode for SQLite, batch writes, consider moving to PostgreSQL if needed
3. **Third bottleneck: Telegram API flood limits**  
   - How to fix: Implement sendMessage rate limiting (30 messages/second max)

---

## Anti-Patterns

### Anti-Pattern 1: Direct API Calls in Handlers

**What people do:** Call ActualBudget API directly inside Telegram message handlers
**Why it's wrong:** Handlers become untestable, error handling is scattered, API changes require handler updates
**Do this instead:** Use repository pattern with dependency injection; handlers call repository methods

### Anti-Pattern 2: Global Mutable State

**What people do:** Use global variables for user state, transaction cache, etc.
**Why it's wrong:** Race conditions, impossible to test, unpredictable behavior across restarts
**Do this instead:** Use proper state container (Map with user ID key) or state machine pattern

### Anti-Pattern 3: No Idempotency

**What people do:** Process callback updates without checking if already processed
**Why it's wrong:** User double-tapping category button causes duplicate category updates, potential data corruption
**Do this instead:** Track processed callback IDs in database; check before processing

### Anti-Pattern 4: No Error Recovery

**What people do:** Let exceptions bubble up unhandled, crash bot on any error
**Why it's wrong:** Single transaction failure shouldn't crash entire bot
**Do this instead:** Wrap operations in try/catch, implement retry logic, graceful degradation

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Telegram Bot API** | grammY HTTP long-polling | Uses Bot API 9.5; set webhook or long-polling mode |
| **ActualBudget Server** | @actual-app/api | Connects via WebSocket to sync server; requires server URL + password |
| **Coolify** | Docker container | Single container deployment; health check endpoint recommended |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Telegram handlers ↔ Services** | Direct function calls | Handlers call service methods; services return typed results |
| **Services ↔ Database** | Knex queries | Services don't know about Knex internals; use query functions |
| **Services ↔ ActualBudget** | Repository interface | Abstracted behind interface for testability |
| **Scheduler ↔ Poller** | Event emission | Scheduler emits "poll" event; poller responds |

---

## Build Order

### Phase 1: Foundation

```
1. config/ + types/          # Environment setup, type definitions
2. services/database/       # SQLite setup with migrations
3. services/actual/client    # ActualBudget connection test
```

**Rationale:** Establishes types and persistence layer before building features

### Phase 2: Core Integration

```
4. services/actual/transactions  # Fetch uncategorized transactions
5. services/actual/categories   # Fetch and cache categories
```

**Rationale:** Can test API integration without Telegram; validates data models

### Phase 3: Bot Basics

```
6. services/telegram/bot      # grammY setup, echo handler
7. services/telegram/messages # Message formatting
```

**Rationale:** Verifies Telegram bot token works; simplest possible interaction

### Phase 4: User Interaction

```
8. services/telegram/keyboards    # Inline keyboard builder
9. services/telegram/handlers     # Command and callback handlers
10. state/user                    # User state machine
```

**Rationale:** Builds the categorization UX; state machine prevents invalid transitions

### Phase 5: Automation

```
11. services/poller/scheduler     # Scheduled polling
12. services/poller/integrate     # Connect scheduler to bot
```

**Rationale:** Brings the "proactive" element; runs on interval after everything else works

---

## Sources

- grammY Documentation: https://grammy.dev/ (Bot API 9.5, March 2026)
- @actual-app/api: https://actualbudget.org/docs/api/ (Official API docs)
- Actual-ai Reference: https://github.com/sakowicz/actual-ai (Integration patterns)
- better-sqlite3: https://github.com/better-sqlite3/better-sqlite3 (SQLite patterns)
- Telegram Bot API: https://core.telegram.org/bots/api (Callback queries, inline keyboards)

---

*Architecture research for: Telegram bot for ActualBudget transaction categorization*
*Researched: 2026-03-11*
